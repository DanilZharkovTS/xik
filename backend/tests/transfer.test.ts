import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  auth,
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
  const olga = await createUser('moderator', 'olga@test.io')
  const product = await createProduct('A')
  const other = await createProduct('B')
  await grant(anna.id, product.id, admin.id)
  await grant(ivan.id, product.id, admin.id)
  await grant(anna.id, other.id, admin.id)
  const tokens = {
    admin: (await loginOk('admin@test.io')).accessToken,
    anna: (await loginOk('anna@test.io')).accessToken,
    ivan: (await loginOk('ivan@test.io')).accessToken,
  }

  const register = async (value: string, productId = product.id) =>
    (
      await api()
        .post('/api/outreach/targets')
        .set(inProduct(tokens.anna, productId))
        .send({ value })
        .expect(201)
    ).body.target.id as string

  const targets = [await register('@target_one'), await register('@target_two'), await register('@target_three')]
  const inOther = await register('@in_other_product', other.id)

  return { admin, anna, ivan, olga, product, other, tokens, targets, inOther }
}

const transfer = (token: string, body: Record<string, unknown>) =>
  api().post('/api/team/transfer-targets').set(auth(token)).send(body)

describe('передача цілей', () => {
  it('усі цілі джерела переходять одержувачу; історія зберігається, дописується запис', async () => {
    const { admin, anna, ivan, product, tokens, targets, inOther } = await setup()
    const eventsBefore = await prisma.outreachEvent.count({ where: { targetId: { in: targets } } })

    const res = await transfer(tokens.admin, {
      productId: product.id,
      fromUserId: anna.id,
      toUserId: ivan.id,
    })

    expect(res.status).toBe(200)
    expect(res.body.transferred).toBe(3)

    const owners = await prisma.outreachTarget.findMany({ where: { id: { in: targets } } })
    expect(owners.every((t) => t.ownerUserId === ivan.id)).toBe(true)

    // Ціль з іншого продукту не чіпається.
    expect((await prisma.outreachTarget.findUniqueOrThrow({ where: { id: inOther } })).ownerUserId).toBe(anna.id)

    // Усі старі події на місці, плюс по одному запису про передачу.
    expect(await prisma.outreachEvent.count({ where: { targetId: { in: targets } } })).toBe(eventsBefore + 3)
    const note = await prisma.outreachEvent.findFirstOrThrow({ where: { targetId: targets[0], type: 'status' } })
    expect(note.comment).toBe('Transferred from anna to ivan by an administrator')
    expect(note.userId).toBe(admin.id)
    expect(await prisma.outreachEvent.count({ where: { targetId: targets[0], type: 'first' } })).toBe(1)
  })

  it('аудит записує хто, від кого, кому, скільки', async () => {
    const { admin, anna, ivan, product, tokens } = await setup()
    await transfer(tokens.admin, { productId: product.id, fromUserId: anna.id, toUserId: ivan.id }).expect(200)

    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { action: 'targets_transferred' } })

    expect(audit).toMatchObject({ actorUserId: admin.id, targetUserId: ivan.id, productId: product.id })
    expect(audit.meta).toMatchObject({ fromUserId: anna.id, toUserId: ivan.id, count: 3 })
  })

  it('після передачі новий власник керує ціллю, колишній ні', async () => {
    const { anna, ivan, product, tokens, targets } = await setup()
    await transfer(tokens.admin, { productId: product.id, fromUserId: anna.id, toUserId: ivan.id }).expect(200)
    const repeat = (token: string) =>
      api()
        .post(`/api/outreach/targets/${targets[0]}/events`)
        .set(inProduct(token, product.id))
        .send({ type: 'repeat' })

    expect((await repeat(tokens.ivan)).status).toBe(201)
    expect((await repeat(tokens.anna)).status).toBe(403)

    const check = await api()
      .post('/api/outreach/check')
      .set(inProduct(tokens.ivan, product.id))
      .send({ value: '@target_one' })
    expect(check.body.status).toBe('mine')
    expect(check.body.target.events.some((e: { type: string }) => e.type === 'first')).toBe(true)
  })

  it('можна передати лише вибрані цілі', async () => {
    const { anna, ivan, product, tokens, targets } = await setup()

    const res = await transfer(tokens.admin, {
      productId: product.id,
      fromUserId: anna.id,
      toUserId: ivan.id,
      targetIds: [targets[0], targets[2]],
    })

    expect(res.body.transferred).toBe(2)
    const owners = Object.fromEntries(
      (await prisma.outreachTarget.findMany({ where: { id: { in: targets } } })).map((t) => [t.id, t.ownerUserId])
    )
    expect(owners).toEqual({ [targets[0]]: ivan.id, [targets[1]]: anna.id, [targets[2]]: ivan.id })
  })

  it('чужа ціль у списку скасовує всю передачу', async () => {
    const { anna, ivan, olga, product, tokens, targets } = await setup()
    await grant(olga.id, product.id, (await prisma.user.findFirstOrThrow({ where: { role: 'admin' } })).id)
    const ivansTarget = (
      await api().post('/api/outreach/targets').set(inProduct(tokens.ivan, product.id)).send({ value: '@ivans_one' })
    ).body.target.id

    const res = await transfer(tokens.admin, {
      productId: product.id,
      fromUserId: anna.id,
      toUserId: olga.id,
      targetIds: [targets[0], ivansTarget],
    })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('TARGETS_NOT_FOUND')
    expect((await prisma.outreachTarget.findUniqueOrThrow({ where: { id: targets[0] } })).ownerUserId).toBe(anna.id)
    expect(await prisma.auditEvent.count({ where: { action: 'targets_transferred' } })).toBe(0)
  })

  it('одержувач має працювати в продукті, бути активним і відрізнятися від джерела', async () => {
    const { admin, anna, ivan, olga, product, tokens } = await setup()
    const send = (toUserId: string, fromUserId = anna.id) =>
      transfer(tokens.admin, { productId: product.id, fromUserId, toUserId })

    const noAccess = await send(olga.id)
    expect(noAccess.status).toBe(409)
    expect(noAccess.body.code).toBe('RECIPIENT_NOT_IN_PRODUCT')

    await prisma.productMembership.updateMany({ where: { userId: ivan.id }, data: { revokedAt: new Date() } })
    expect((await send(ivan.id)).status).toBe(409)

    await grant(ivan.id, product.id, admin.id)
    await prisma.user.update({ where: { id: ivan.id }, data: { deactivatedAt: new Date() } })
    expect((await send(ivan.id)).body.code).toBe('RECIPIENT_DEACTIVATED')

    expect((await send(anna.id)).body.code).toBe('SAME_USER')
    expect(await prisma.outreachTarget.count({ where: { ownerUserId: anna.id } })).toBe(4)
  })

  it('одержувачем може бути адмін', async () => {
    const { admin, anna, product, tokens } = await setup()

    const res = await transfer(tokens.admin, { productId: product.id, fromUserId: anna.id, toUserId: admin.id })

    expect(res.status).toBe(200)
  })

  it('нічого передавати 409, невідомі продукт чи користувач 404', async () => {
    const { anna, ivan, product, tokens } = await setup()

    expect((await transfer(tokens.admin, { productId: product.id, fromUserId: ivan.id, toUserId: anna.id })).body.code).toBe('NOTHING_TO_TRANSFER')
    expect((await transfer(tokens.admin, { productId: 'missing', fromUserId: anna.id, toUserId: ivan.id })).status).toBe(404)
    expect((await transfer(tokens.admin, { productId: product.id, fromUserId: 'missing', toUserId: ivan.id })).status).toBe(404)
    expect((await transfer(tokens.admin, { productId: product.id, fromUserId: anna.id })).status).toBe(400)
  })

  it('лише адмін: модератор (навіть власник цілей) отримує 403, без токена 401', async () => {
    const { anna, ivan, product, tokens } = await setup()
    const body = { productId: product.id, fromUserId: anna.id, toUserId: ivan.id }

    expect((await transfer(tokens.anna, body)).status).toBe(403)
    expect((await api().post('/api/team/transfer-targets').send(body)).status).toBe(401)
    expect(await prisma.outreachTarget.count({ where: { ownerUserId: anna.id } })).toBe(4)
  })

  it('змагання: дві одночасні передачі всіх цілей, виграє одна', async () => {
    const { admin, anna, ivan, olga, product, tokens } = await setup()
    await grant(olga.id, product.id, admin.id)

    const results = await Promise.all([
      transfer(tokens.admin, { productId: product.id, fromUserId: anna.id, toUserId: ivan.id }),
      transfer(tokens.admin, { productId: product.id, fromUserId: anna.id, toUserId: olga.id }),
    ])

    expect(results.map((r) => r.status).sort()).toEqual([200, 409])
    const byIvan = await prisma.outreachTarget.count({ where: { productId: product.id, ownerUserId: ivan.id } })
    const byOlga = await prisma.outreachTarget.count({ where: { productId: product.id, ownerUserId: olga.id } })
    expect(byIvan + byOlga).toBe(3)
    expect(byIvan === 3 || byOlga === 3).toBe(true)
  })
})

describe('цілі колишнього учасника', () => {
  it('після забирання продукту цілі лишаються за ним, повторно їх не зайняти, адмін бачить список', async () => {
    const { admin, anna, ivan, product, tokens } = await setup()
    await api()
      .delete(`/api/team/moderators/${anna.id}/products/${product.id}`)
      .set(auth(tokens.admin))
      .expect(200)

    const taken = await api()
      .post('/api/outreach/targets')
      .set(inProduct(tokens.ivan, product.id))
      .send({ value: '@target_one' })
    expect(taken.status).toBe(409)
    expect(taken.body.owner.name).toBe('anna')

    const list = await api()
      .get('/api/team/targets')
      .query({ productId: product.id, ownerId: anna.id })
      .set(auth(tokens.admin))
    expect(list.status).toBe(200)
    expect(list.body.targets).toHaveLength(3)
    expect(list.body.targets[0].identifiers[0].value).toMatch(/target_/)

    await transfer(tokens.admin, { productId: product.id, fromUserId: anna.id, toUserId: ivan.id }).expect(200)
    expect(admin.id).toBeTruthy()
  })

  it('список цілей: пагінація, лише адмін, невідомі продукт чи користувач 404', async () => {
    const { anna, product, tokens } = await setup()
    const get = (token: string, query: Record<string, string>) =>
      api().get('/api/team/targets').query(query).set(auth(token))

    const seen: string[] = []
    let cursor: string | null = null
    do {
      const res: { body: { targets: { id: string }[]; nextCursor: string | null } } = await get(tokens.admin, {
        productId: product.id,
        ownerId: anna.id,
        limit: '2',
        ...(cursor ? { lastId: cursor } : {}),
      })
      seen.push(...res.body.targets.map((t) => t.id))
      cursor = res.body.nextCursor
    } while (cursor)
    expect(new Set(seen).size).toBe(3)

    expect((await get(tokens.anna, { productId: product.id, ownerId: anna.id })).status).toBe(403)
    expect((await get(tokens.admin, { productId: 'missing', ownerId: anna.id })).status).toBe(404)
    expect((await get(tokens.admin, { productId: product.id, ownerId: 'missing' })).status).toBe(404)
  })
})
