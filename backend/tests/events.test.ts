import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  createProduct,
  createUser,
  grant,
  inProduct,
  loginOk,
  resetDb,
} from './helpers.js'

beforeEach(resetDb)

const setup = async () => {
  const admin = await createUser('admin', 'admin@test.io')
  const anna = await createUser('moderator', 'anna@test.io')
  const ivan = await createUser('moderator', 'ivan@test.io')
  const product = await createProduct('A')
  await grant(anna.id, product.id, admin.id)
  await grant(ivan.id, product.id, admin.id)
  const tokens = {
    admin: (await loginOk('admin@test.io')).accessToken,
    anna: (await loginOk('anna@test.io')).accessToken,
    ivan: (await loginOk('ivan@test.io')).accessToken,
  }
  const created = await api()
    .post('/api/outreach/targets')
    .set(inProduct(tokens.anna, product.id))
    .send({ value: '@durov' })
  return { admin, anna, ivan, product, tokens, targetId: created.body.target.id as string }
}

const event = (token: string, productId: string, targetId: string, body: Record<string, unknown>) =>
  api().post(`/api/outreach/targets/${targetId}/events`).set(inProduct(token, productId)).send(body)

const dnc = (token: string, productId: string, targetId: string, reason?: string) =>
  api().post(`/api/outreach/targets/${targetId}/do-not-contact`).set(inProduct(token, productId)).send({ reason })

const release = (token: string, productId: string, targetId: string) =>
  api().post(`/api/outreach/targets/${targetId}/release`).set(inProduct(token, productId)).send({})

describe('повторне звернення і відповідь', () => {
  it('повтор дописується в історію й зсуває останній контакт', async () => {
    const { product, tokens, targetId } = await setup()
    const before = (await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })).lastContactedAt!

    const res = await event(tokens.anna, product.id, targetId, {
      type: 'repeat',
      channel: 'email',
      comment: 'follow-up',
      url: 'https://mail.example.com/thread/1',
    })

    expect(res.status).toBe(201)
    expect(res.body.target.events.map((e: { type: string }) => e.type)).toEqual(['repeat', 'first'])
    expect(res.body.target.events[0]).toMatchObject({ channel: 'email', comment: 'follow-up' })
    const after = (await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })).lastContactedAt!
    expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })

  it('відповідь не рухає останній контакт', async () => {
    const { product, tokens, targetId } = await setup()
    const before = await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })

    await event(tokens.anna, product.id, targetId, { type: 'reply', comment: 'they answered' }).expect(201)

    const after = await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })
    expect(after.lastContactedAt).toEqual(before.lastContactedAt)
  })

  it('подія заднім числом не відкочує останній контакт назад', async () => {
    const { product, tokens, targetId } = await setup()
    const before = await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })

    await event(tokens.anna, product.id, targetId, {
      type: 'repeat',
      occurredAt: '2020-01-01T10:00:00Z',
    }).expect(201)

    const after = await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })
    expect(after.lastContactedAt).toEqual(before.lastContactedAt)
  })

  it('дата з майбутнього, тип first/status і погані дані відхиляються', async () => {
    const { product, tokens, targetId } = await setup()
    const future = new Date(Date.now() + 3600_000).toISOString()

    expect((await event(tokens.anna, product.id, targetId, { type: 'repeat', occurredAt: future })).status).toBe(400)
    expect((await event(tokens.anna, product.id, targetId, { type: 'first' })).status).toBe(400)
    expect((await event(tokens.anna, product.id, targetId, { type: 'status' })).status).toBe(400)
    expect((await event(tokens.anna, product.id, targetId, { type: 'repeat', url: 'javascript:alert(1)' })).status).toBe(400)
    expect((await event(tokens.anna, product.id, targetId, { type: 'repeat', channel: 'fax' })).status).toBe(400)
    expect(await prisma.outreachEvent.count()).toBe(1)
  })

  it('чужа ціль 403, адмін може, неіснуюча 404', async () => {
    const { product, tokens, targetId } = await setup()

    expect((await event(tokens.ivan, product.id, targetId, { type: 'repeat' })).status).toBe(403)
    expect((await event(tokens.admin, product.id, targetId, { type: 'repeat' })).status).toBe(201)
    expect((await event(tokens.anna, product.id, 'missing', { type: 'repeat' })).status).toBe(404)
  })

  it('ціль з іншого продукту недоступна за id', async () => {
    const { admin, anna, tokens, targetId } = await setup()
    const other = await createProduct('B')
    await grant(anna.id, other.id, admin.id)

    expect((await event(tokens.anna, other.id, targetId, { type: 'repeat' })).status).toBe(404)
  })
})

describe('«не писати»', () => {
  it('власник ставить, повтор блокується, відповідь дозволена, історія має запис', async () => {
    const { product, tokens, targetId } = await setup()

    const res = await dnc(tokens.anna, product.id, targetId, 'asked to stop')

    expect(res.status).toBe(200)
    expect(res.body.target.status).toBe('do_not_contact')
    expect(res.body.target.statusReason).toBe('asked to stop')
    expect(res.body.target.events[0]).toMatchObject({ type: 'status', comment: 'Do not contact: asked to stop' })
    expect(res.body.target.permissions).toMatchObject({
      canRepeat: false,
      canReply: true,
      canMarkDoNotContact: false,
      canRelease: false,
    })

    const repeat = await event(tokens.anna, product.id, targetId, { type: 'repeat' })
    expect(repeat.status).toBe(409)
    expect(repeat.body.code).toBe('DO_NOT_CONTACT')
    expect((await event(tokens.anna, product.id, targetId, { type: 'reply' })).status).toBe(201)
  })

  it('видно всім; чужий модератор не може ні поставити, ні зняти', async () => {
    const { product, tokens, targetId } = await setup()
    await dnc(tokens.anna, product.id, targetId).expect(200)

    const seen = await api()
      .post('/api/outreach/check')
      .set(inProduct(tokens.ivan, product.id))
      .send({ value: 't.me/durov' })
    expect(seen.body.status).toBe('do_not_contact')

    expect((await release(tokens.ivan, product.id, targetId)).status).toBe(403)
    expect((await dnc(tokens.ivan, product.id, targetId)).status).toBe(403)
  })

  it('модератор не може поставити «не писати» на чужу ціль', async () => {
    const { product, tokens, targetId } = await setup()

    const res = await dnc(tokens.ivan, product.id, targetId)

    expect(res.status).toBe(403)
    expect((await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })).status).toBe('active')
  })

  it('зняти може лише адмін; власник не може; після цього повтор знову дозволений', async () => {
    const { product, tokens, targetId } = await setup()
    await dnc(tokens.anna, product.id, targetId, 'stop').expect(200)

    const byOwner = await release(tokens.anna, product.id, targetId)
    expect(byOwner.status).toBe(403)
    expect((await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })).status).toBe('do_not_contact')

    const byAdmin = await release(tokens.admin, product.id, targetId)
    expect(byAdmin.status).toBe(200)
    expect(byAdmin.body.target.status).toBe('active')
    expect(byAdmin.body.target.statusReason).toBeNull()

    expect((await event(tokens.anna, product.id, targetId, { type: 'repeat' })).status).toBe(201)
  })

  it('повторне «не писати» і зняття активної цілі дають 409', async () => {
    const { product, tokens, targetId } = await setup()

    expect((await release(tokens.admin, product.id, targetId)).status).toBe(409)
    await dnc(tokens.anna, product.id, targetId).expect(200)
    expect((await dnc(tokens.anna, product.id, targetId)).status).toBe(409)
  })

  it('адмін може поставити «не писати» на чужу ціль', async () => {
    const { product, tokens, targetId } = await setup()

    expect((await dnc(tokens.admin, product.id, targetId, 'legal request')).status).toBe(200)
  })

  it('усі зміни статусу пишуться в аудит', async () => {
    const { anna, product, tokens, targetId } = await setup()
    await dnc(tokens.anna, product.id, targetId, 'stop')
    await release(tokens.admin, product.id, targetId)

    const audit = await prisma.auditEvent.findMany({ orderBy: { createdAt: 'asc' } })

    expect(audit.map((a) => a.action)).toEqual(['target_do_not_contact', 'target_released'])
    expect(audit[0]).toMatchObject({ productId: product.id, targetUserId: anna.id })
    expect(audit[0].meta).toEqual({ targetId })
  })

  it('FOR UPDATE: повтор, що чекає на блокування, бачить новий статус і відхиляється', async () => {
    const { product, tokens, targetId } = await setup()

    let pending!: Promise<{ status: number }>

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "OutreachTarget" WHERE "id" = ${targetId} FOR UPDATE`
      await tx.outreachTarget.update({
        where: { id: targetId },
        data: { status: 'do_not_contact' },
      })

      // Запит стартує, поки статус ще не закомічено. Без блокування він побачив би "active".
      pending = event(tokens.anna, product.id, targetId, { type: 'repeat' }).then((r) => r)
      await new Promise((resolve) => setTimeout(resolve, 400))
    })

    expect((await pending).status).toBe(409)
    expect(await prisma.outreachEvent.count({ where: { type: 'repeat' } })).toBe(0)
  })

  it('змагання: «не писати» й купа повторів одночасно не ламають цілісність', async () => {
    const { product, tokens, targetId } = await setup()

    const results = await Promise.all([
      dnc(tokens.anna, product.id, targetId),
      ...Array.from({ length: 8 }, () => event(tokens.anna, product.id, targetId, { type: 'repeat' })),
    ])

    expect(results[0].status).toBe(200)
    const accepted = results.slice(1).filter((r) => r.status === 201).length
    const rejected = results.slice(1).filter((r) => r.status === 409).length
    expect(accepted + rejected).toBe(8)
    expect(await prisma.outreachEvent.count({ where: { type: 'repeat' } })).toBe(accepted)
    // Після завершення всі наступні повтори вже відхиляються.
    expect((await event(tokens.anna, product.id, targetId, { type: 'repeat' })).status).toBe(409)
  })
})

describe('публікації', () => {
  const publish = (token: string, productId: string, body: Record<string, unknown>) =>
    api().post('/api/outreach/publications').set(inProduct(token, productId)).send(body)

  it('створює публікацію без цілі й не рахує її серед звернень', async () => {
    const { product, tokens } = await setup()

    const res = await publish(tokens.anna, product.id, {
      channel: 'tiktok',
      kind: 'ad',
      url: 'https://www.tiktok.com/@acme/video/123',
      comment: 'Ad block with our link',
    })

    expect(res.status).toBe(201)
    expect(res.body.publication).toMatchObject({
      channel: 'tiktok',
      kind: 'ad',
      author: 'anna',
      comment: 'Ad block with our link',
    })
    const row = await prisma.outreachEvent.findFirstOrThrow({ where: { type: 'publication' } })
    expect(row.targetId).toBeNull()
    expect(await prisma.outreachEvent.count({ where: { type: { in: ['first', 'repeat'] } } })).toBe(1)
  })

  it('дедуплікація за URL (трекінг і www не рахуються), видно автора й дату', async () => {
    const { product, tokens } = await setup()
    await publish(tokens.anna, product.id, {
      channel: 'instagram',
      kind: 'post',
      url: 'https://www.instagram.com/p/AbC123/?igsh=x',
    }).expect(201)

    const dup = await publish(tokens.ivan, product.id, {
      channel: 'instagram',
      kind: 'post',
      url: 'https://instagram.com/p/AbC123?utm_source=ig',
    })

    expect(dup.status).toBe(409)
    expect(dup.body.code).toBe('ALREADY_PUBLISHED')
    expect(dup.body.existing.author).toBe('anna')
    expect(await prisma.outreachEvent.count({ where: { type: 'publication' } })).toBe(1)
  })

  it('гонка: однакова публікація від кількох модераторів записується один раз', async () => {
    const { product, tokens } = await setup()

    const results = await Promise.all(
      [tokens.anna, tokens.ivan, tokens.anna, tokens.ivan].map((token) =>
        publish(token, product.id, { channel: 'x', kind: 'post', url: 'https://x.com/acme/status/1' })
      )
    )

    expect(results.filter((r) => r.status === 201)).toHaveLength(1)
    expect(results.filter((r) => r.status === 409)).toHaveLength(3)
    expect(await prisma.outreachEvent.count({ where: { type: 'publication' } })).toBe(1)
  })

  it('той самий URL у різних продуктах записується окремо', async () => {
    const { admin, anna, product, tokens } = await setup()
    const other = await createProduct('B')
    await grant(anna.id, other.id, admin.id)
    const body = { channel: 'facebook', kind: 'article', url: 'https://facebook.com/acme/posts/1' }

    await publish(tokens.anna, product.id, body).expect(201)
    await publish(tokens.anna, other.id, body).expect(201)
  })

  it('канал і вид перевіряються, URL обов’язковий і лише http(s)', async () => {
    const { product, tokens } = await setup()
    const base = { channel: 'x', kind: 'post', url: 'https://x.com/a/status/1' }

    expect((await publish(tokens.anna, product.id, { ...base, channel: 'myspace' })).status).toBe(400)
    expect((await publish(tokens.anna, product.id, { ...base, kind: 'spam' })).status).toBe(400)
    expect((await publish(tokens.anna, product.id, { ...base, url: undefined })).status).toBe(400)
    expect((await publish(tokens.anna, product.id, { ...base, url: 'javascript:alert(1)' })).status).toBe(400)
    expect((await publish(tokens.anna, product.id, { ...base, url: 'http://localhost/x' })).status).toBe(400)
  })

  it('модератор бачить свої публікації, адмін всі; пагінація без повторів', async () => {
    const { product, tokens } = await setup()
    for (let i = 1; i <= 3; i++) {
      await publish(tokens.anna, product.id, { channel: 'x', kind: 'post', url: `https://x.com/a/status/${i}` }).expect(201)
    }
    await publish(tokens.ivan, product.id, { channel: 'x', kind: 'post', url: 'https://x.com/b/status/9' }).expect(201)
    const list = (token: string, query: Record<string, unknown> = {}) =>
      api().get('/api/outreach/publications').query(query).set(inProduct(token, product.id))

    expect((await list(tokens.anna)).body.publications).toHaveLength(3)
    expect((await list(tokens.ivan)).body.publications).toHaveLength(1)
    expect((await list(tokens.admin)).body.publications).toHaveLength(4)

    const seen: string[] = []
    let cursor: string | null = null
    do {
      const res: { body: { publications: { id: string }[]; nextCursor: string | null } } = await list(
        tokens.admin,
        { limit: 3, ...(cursor ? { lastId: cursor } : {}) }
      )
      seen.push(...res.body.publications.map((p) => p.id))
      cursor = res.body.nextCursor
    } while (cursor)
    expect(new Set(seen).size).toBe(4)
  })

  it('не потрапляє у список цілей і не змінює останній контакт', async () => {
    const { product, tokens, targetId } = await setup()
    const before = await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })

    await publish(tokens.anna, product.id, { channel: 'x', kind: 'post', url: 'https://x.com/a/status/1' }).expect(201)

    const targets = await api().get('/api/outreach/targets').set(inProduct(tokens.anna, product.id))
    expect(targets.body.targets).toHaveLength(1)
    const after = await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targetId } })
    expect(after.lastContactedAt).toEqual(before.lastContactedAt)
  })

  it('доступ лише в межах продукту: чужий продукт 403, без токена 401', async () => {
    const { tokens } = await setup()
    const other = await createProduct('B')

    expect((await publish(tokens.anna, other.id, { channel: 'x', kind: 'post', url: 'https://x.com/a/status/1' })).status).toBe(403)
    expect((await api().post('/api/outreach/publications').send({})).status).toBe(401)
  })

  it('CHECK у БД не пускає публікацію з ціллю чи подію без виду', async () => {
    const { anna, product, targetId } = await setup()

    await expect(
      prisma.outreachEvent.create({
        data: { productId: product.id, userId: anna.id, type: 'publication', targetId },
      })
    ).rejects.toThrow()
    await expect(
      prisma.outreachEvent.create({
        data: { productId: product.id, userId: anna.id, type: 'repeat', targetId: null },
      })
    ).rejects.toThrow()
  })
})
