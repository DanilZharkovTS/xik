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
  const productA = await createProduct('A')
  const productB = await createProduct('B')
  await grant(anna.id, productA.id, admin.id)
  await grant(ivan.id, productA.id, admin.id)
  const tokens = {
    admin: (await loginOk('admin@test.io')).accessToken,
    anna: (await loginOk('anna@test.io')).accessToken,
    ivan: (await loginOk('ivan@test.io')).accessToken,
  }
  return { admin, anna, ivan, productA, productB, tokens }
}

const check = (token: string, productId: string, value: string, channel?: string) =>
  api().post('/api/outreach/check').set(inProduct(token, productId)).send({ value, channel })

const register = (token: string, productId: string, body: Record<string, unknown>) =>
  api().post('/api/outreach/targets').set(inProduct(token, productId)).send(body)

describe('перевірка ідентифікатора', () => {
  it('вільний, поки ніхто не писав', async () => {
    const { productA, tokens } = await setup()

    const res = await check(tokens.anna, productA.id, '@Durov')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      normalized: { channel: 'telegram', value: 'durov' },
      status: 'free',
    })
  })

  it('після реєстрації власник бачить "мій" з повною історією', async () => {
    const { productA, tokens } = await setup()
    await register(tokens.anna, productA.id, {
      value: 't.me/Durov',
      displayName: 'Pavel',
      comment: 'first message',
      url: 'https://t.me/durov/1',
    }).expect(201)

    const res = await check(tokens.anna, productA.id, 'https://telegram.me/DUROV/')

    expect(res.body.status).toBe('mine')
    expect(res.body.target.displayName).toBe('Pavel')
    expect(res.body.target.identifiers).toEqual([
      { channel: 'telegram', value: 'durov', href: 'https://t.me/durov' },
    ])
    expect(res.body.target.events).toHaveLength(1)
    expect(res.body.target.events[0]).toMatchObject({
      type: 'first',
      channel: 'telegram',
      comment: 'first message',
      url: 'https://t.me/durov/1',
    })
  })

  it('чужий модератор бачить лише власника й дату, без історії та ідентифікаторів', async () => {
    const { productA, tokens } = await setup()
    await register(tokens.anna, productA.id, {
      value: 'john@example.com',
      comment: 'secret note',
    }).expect(201)

    const res = await check(tokens.ivan, productA.id, 'JOHN@example.com')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('foreign')
    expect(res.body.owner).toEqual({ name: 'anna' })
    expect(res.body.firstContactedAt).toBeTruthy()
    expect(res.body.target).toBeUndefined()
    expect(JSON.stringify(res.body)).not.toContain('secret note')
  })

  it('адмін бачить повну історію чужої цілі', async () => {
    const { productA, tokens } = await setup()
    await register(tokens.anna, productA.id, { value: 'company.com', comment: 'hi' }).expect(201)

    const res = await check(tokens.admin, productA.id, 'https://www.company.com/x')

    expect(res.body.status).toBe('foreign')
    expect(res.body.target.events[0].comment).toBe('hi')
    expect(res.body.target.events[0].author).toBe('anna')
  })

  it('"не писати" видно всім, причина лише власнику й адміну', async () => {
    const { productA, tokens } = await setup()
    const created = await register(tokens.anna, productA.id, { value: '@spammer1' })
    await prisma.outreachTarget.update({
      where: { id: created.body.target.id },
      data: { status: 'do_not_contact', statusReason: 'asked to stop' },
    })

    const forOwner = await check(tokens.anna, productA.id, '@spammer1')
    const forOther = await check(tokens.ivan, productA.id, '@spammer1')

    expect(forOwner.body.status).toBe('do_not_contact')
    expect(forOwner.body.target.statusReason).toBe('asked to stop')
    expect(forOther.body.status).toBe('do_not_contact')
    expect(JSON.stringify(forOther.body)).not.toContain('asked to stop')
  })

  it('невалідне значення 400, канал можна задати вручну', async () => {
    const { productA, tokens } = await setup()

    const bad = await check(tokens.anna, productA.id, 'just words')
    expect(bad.status).toBe(400)
    expect(bad.body.code).toBe('INVALID_IDENTIFIER')

    const manual = await check(tokens.anna, productA.id, 'durov', 'telegram')
    expect(manual.status).toBe(200)
    expect(manual.body.normalized).toEqual({ channel: 'telegram', value: 'durov' })

    const wrong = await check(tokens.anna, productA.id, 'durov', 'email')
    expect(wrong.status).toBe(400)
  })
})

describe('реєстрація першого звернення', () => {
  it('створює ціль, ідентифікатор і подію first; власник незмінний', async () => {
    const { anna, productA, tokens } = await setup()

    const res = await register(tokens.anna, productA.id, { value: '@Durov' })

    expect(res.status).toBe(201)
    expect(res.body.target.owner.name).toBe('anna')
    expect(res.body.target.displayName).toBe('durov')

    const targets = await prisma.outreachTarget.findMany()
    expect(targets).toHaveLength(1)
    expect(targets[0].ownerUserId).toBe(anna.id)
    expect(targets[0].firstContactedAt).not.toBeNull()
    expect(await prisma.outreachEvent.count({ where: { type: 'first' } })).toBe(1)
  })

  it('другий модератор не може забрати вже зареєстрований ідентифікатор', async () => {
    const { anna, productA, tokens } = await setup()
    await register(tokens.anna, productA.id, { value: '@durov' }).expect(201)

    const res = await register(tokens.ivan, productA.id, { value: 't.me/DUROV' })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('ALREADY_REGISTERED')
    expect(res.body.status).toBe('foreign')
    expect(res.body.owner.name).toBe('anna')
    expect(res.body.target).toBeUndefined()

    // Невдала спроба не лишає порожніх цілей і подій.
    expect(await prisma.outreachTarget.count()).toBe(1)
    expect(await prisma.outreachEvent.count()).toBe(1)
    expect((await prisma.outreachTarget.findFirstOrThrow()).ownerUserId).toBe(anna.id)
  })

  it('повторна реєстрація власником повертає 409 зі статусом "мій"', async () => {
    const { productA, tokens } = await setup()
    await register(tokens.anna, productA.id, { value: '@durov' }).expect(201)

    const res = await register(tokens.anna, productA.id, { value: '@durov' })

    expect(res.status).toBe(409)
    expect(res.body.status).toBe('mine')
    expect(res.body.target.events).toHaveLength(1)
  })

  it('гонка: п’ять модераторів одночасно, виграє рівно один', async () => {
    const { admin, productA, tokens } = await setup()
    const racers = [tokens.anna, tokens.ivan]
    for (let i = 0; i < 3; i++) {
      const user = await createUser('moderator', `racer${i}@test.io`)
      await grant(user.id, productA.id, admin.id)
      racers.push((await loginOk(`racer${i}@test.io`)).accessToken)
    }

    const results = await Promise.all(
      racers.map((token, i) =>
        register(token, productA.id, { value: i % 2 ? '@durov' : 't.me/Durov' })
      )
    )

    expect(results.filter((r) => r.status === 201)).toHaveLength(1)
    expect(results.filter((r) => r.status === 409)).toHaveLength(4)
    expect(await prisma.outreachTarget.count()).toBe(1)
    expect(await prisma.outreachIdentifier.count()).toBe(1)
    expect(await prisma.outreachEvent.count()).toBe(1)
  })

  it('підроблений productId у тілі ігнорується, продукт береться із членства', async () => {
    const { productA, productB, tokens } = await setup()

    const res = await register(tokens.anna, productA.id, {
      value: '@forged1',
      productId: productB.id,
      ownerUserId: 'someone-else',
    })

    expect(res.status).toBe(201)
    const target = await prisma.outreachTarget.findFirstOrThrow()
    expect(target.productId).toBe(productA.id)
    expect(target.ownerUserId).not.toBe('someone-else')
  })

  it('URL-доказ має бути http(s)', async () => {
    const { productA, tokens } = await setup()

    const res = await register(tokens.anna, productA.id, {
      value: '@durov',
      url: 'javascript:alert(1)',
    })

    expect(res.status).toBe(400)
  })
})

describe('кілька ідентифікаторів однієї цілі', () => {
  it('пошук за будь-яким знаходить ту саму ціль', async () => {
    const { productA, tokens } = await setup()
    const created = await register(tokens.anna, productA.id, { value: '@acme_team' })
    const targetId = created.body.target.id

    for (const value of ['hello@acme.com', 'https://www.linkedin.com/company/Acme/', 'blog.acme.com']) {
      await api()
        .post(`/api/outreach/targets/${targetId}/identifiers`)
        .set(inProduct(tokens.anna, productA.id))
        .send({ value })
        .expect(201)
    }

    for (const value of ['acme.com', 'HELLO@acme.com', 'linkedin.com/company/acme', 't.me/acme_team']) {
      const res = await check(tokens.anna, productA.id, value)
      expect(res.body.status).toBe('mine')
      expect(res.body.target.id).toBe(targetId)
    }

    const detail = await api()
      .get(`/api/outreach/targets/${targetId}`)
      .set(inProduct(tokens.anna, productA.id))
    expect(detail.body.target.identifiers).toHaveLength(4)
  })

  it('ідентифікатор іншої цілі додати не можна, видно чужого власника', async () => {
    const { productA, tokens } = await setup()
    const mine = await register(tokens.anna, productA.id, { value: '@annas_target' })
    await register(tokens.ivan, productA.id, { value: 'taken.com' }).expect(201)

    const res = await api()
      .post(`/api/outreach/targets/${mine.body.target.id}/identifiers`)
      .set(inProduct(tokens.anna, productA.id))
      .send({ value: 'https://taken.com/page' })

    expect(res.status).toBe(409)
    expect(res.body.status).toBe('foreign')
    expect(res.body.owner.name).toBe('ivan')
    expect(await prisma.outreachIdentifier.count()).toBe(2)
  })

  it('чужу ціль доповнити не можна (403), неіснуючу 404, "не писати" блокує', async () => {
    const { productA, tokens } = await setup()
    const created = await register(tokens.anna, productA.id, { value: '@annas_target' })
    const id = created.body.target.id
    const add = (token: string, targetId: string) =>
      api()
        .post(`/api/outreach/targets/${targetId}/identifiers`)
        .set(inProduct(token, productA.id))
        .send({ value: 'new@example.com' })

    expect((await add(tokens.ivan, id)).status).toBe(403)
    expect((await add(tokens.anna, 'missing')).status).toBe(404)

    await prisma.outreachTarget.update({ where: { id }, data: { status: 'do_not_contact' } })
    expect((await add(tokens.anna, id)).status).toBe(409)
  })
})

describe('ізоляція продуктів і доступ', () => {
  it('той самий ідентифікатор у різних продуктах незалежний', async () => {
    const { admin, anna, productA, productB, tokens } = await setup()
    await grant(anna.id, productB.id, admin.id)

    await register(tokens.anna, productA.id, { value: '@durov' }).expect(201)
    const inB = await check(tokens.anna, productB.id, '@durov')
    expect(inB.body.status).toBe('free')
    await register(tokens.anna, productB.id, { value: '@durov' }).expect(201)
    expect(await prisma.outreachTarget.count()).toBe(2)
  })

  it('модератор продукту A не бачить і не змінює продукт B (403), невідомий 404', async () => {
    const { productA, productB, tokens } = await setup()
    const created = await register(tokens.anna, productA.id, { value: '@durov' })

    expect((await check(tokens.anna, productB.id, '@durov')).status).toBe(403)
    expect((await register(tokens.anna, productB.id, { value: '@x_user' })).status).toBe(403)
    expect(
      (await api().get('/api/outreach/targets').set(inProduct(tokens.anna, productB.id))).status
    ).toBe(403)
    expect((await check(tokens.anna, 'unknown-product', '@durov')).status).toBe(404)

    // Ціль із продукту A недоступна, навіть якщо підставити її id в продукт, де доступ є.
    const other = await api()
      .get(`/api/outreach/targets/${created.body.target.id}`)
      .set(inProduct(tokens.admin, productB.id))
    expect(other.status).toBe(404)
  })

  it('забраний доступ закриває журнал одразу', async () => {
    const { anna, productA, tokens } = await setup()
    await register(tokens.anna, productA.id, { value: '@durov' }).expect(201)

    await prisma.productMembership.updateMany({
      where: { userId: anna.id, productId: productA.id },
      data: { revokedAt: new Date() },
    })

    expect((await check(tokens.anna, productA.id, '@durov')).status).toBe(403)
  })

  it('без токена 401, покупець (role user) 403', async () => {
    const { productA } = await setup()
    await createUser('user', 'buyer@test.io')
    const buyer = await loginOk('buyer@test.io')

    expect((await api().post('/api/outreach/check').send({ value: '@durov' })).status).toBe(401)
    expect((await check(buyer.accessToken, productA.id, '@durov')).status).toBe(403)
  })

  it('без заголовка продукту 400', async () => {
    const { tokens } = await setup()

    const res = await api()
      .post('/api/outreach/check')
      .set('Authorization', `Bearer ${tokens.anna}`)
      .send({ value: '@durov' })

    expect(res.status).toBe(400)
  })
})

describe('мої цілі', () => {
  it('модератор бачить лише свої, адмін усі', async () => {
    const { productA, tokens } = await setup()
    await register(tokens.anna, productA.id, { value: '@anna_one' })
    await register(tokens.anna, productA.id, { value: '@anna_two' })
    await register(tokens.ivan, productA.id, { value: '@ivan_one' })
    const list = (token: string) =>
      api().get('/api/outreach/targets').set(inProduct(token, productA.id))

    const mine = await list(tokens.anna)
    expect(mine.body.targets.map((t: { displayName: string }) => t.displayName).sort()).toEqual([
      'anna_one',
      'anna_two',
    ])
    expect(mine.body.nextCursor).toBeNull()

    const all = await list(tokens.admin)
    expect(all.body.targets).toHaveLength(3)
  })

  it('пагінація за курсором без повторів', async () => {
    const { productA, tokens } = await setup()
    for (let i = 1; i <= 5; i++) {
      await register(tokens.anna, productA.id, { value: `@target_${i}x` }).expect(201)
    }

    const seen: string[] = []
    let cursor: string | null = null
    let pages = 0
    do {
      const res: { body: { targets: { id: string }[]; nextCursor: string | null } } = await api()
        .get('/api/outreach/targets')
        .query({ limit: 2, ...(cursor ? { lastId: cursor } : {}) })
        .set(inProduct(tokens.anna, productA.id))
      seen.push(...res.body.targets.map((t) => t.id))
      cursor = res.body.nextCursor
      pages++
    } while (cursor)

    expect(pages).toBe(3)
    expect(new Set(seen).size).toBe(5)
  })

  it('чужу ціль за id не отримати: 403, власну 200', async () => {
    const { productA, tokens } = await setup()
    const created = await register(tokens.anna, productA.id, { value: '@annas_one' })
    const url = `/api/outreach/targets/${created.body.target.id}`

    expect((await api().get(url).set(inProduct(tokens.ivan, productA.id))).status).toBe(403)
    expect((await api().get(url).set(inProduct(tokens.anna, productA.id))).status).toBe(200)
    expect((await api().get(url).set(inProduct(tokens.admin, productA.id))).status).toBe(200)
  })

  it('дати віддаються в ISO 8601 з Z', async () => {
    const { productA, tokens } = await setup()
    await register(tokens.anna, productA.id, { value: '@iso_date' })

    const res = await api().get('/api/outreach/targets').set(inProduct(tokens.anna, productA.id))

    expect(res.body.targets[0].lastContactedAt).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/)
  })
})

describe('ліміт частоти', () => {
  it('31-ша перевірка за хвилину від одного користувача дає 429, інший не зачеплений', async () => {
    const { productA, tokens } = await setup()

    const statuses: number[] = []
    for (let i = 0; i < 31; i++) {
      statuses.push((await check(tokens.anna, productA.id, '@limit_user')).status)
    }

    expect(statuses.slice(0, 30).every((s) => s === 200)).toBe(true)
    expect(statuses[30]).toBe(429)
    expect((await check(tokens.ivan, productA.id, '@limit_user')).status).toBe(200)
  })
})
