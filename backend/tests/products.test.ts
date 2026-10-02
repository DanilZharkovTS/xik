import { beforeEach, describe, expect, it, vi } from 'vitest'

// Підроблений Stripe: тримає свій стан і пише виклики, мережі в тестах немає.
const fake = vi.hoisted(() => {
  let seq = 0
  type Obj = Record<string, any>
  const state = {
    products: new Map<string, Obj>(),
    prices: new Map<string, Obj>(),
    calls: [] as string[],
    checkout: [] as Obj[],
    fail: new Set<string>(),
  }
  const missing = () => Object.assign(new Error('No such object'), { code: 'resource_missing' })
  const guard = (op: string) => {
    if (state.fail.has(op)) throw new Error(`${op} failed`)
  }
  const stripe = {
    products: {
      create: async (params: Obj) => {
        guard('products.create')
        state.calls.push('products.create')
        const product = { id: `prod_${++seq}`, active: true, ...params }
        state.products.set(product.id, product)
        return product
      },
      update: async (id: string, params: Obj) => {
        guard('products.update')
        state.calls.push('products.update')
        const product = state.products.get(id)
        if (!product) throw missing()
        Object.assign(product, params)
        return product
      },
      retrieve: async (id: string) => {
        const product = state.products.get(id)
        if (!product) throw missing()
        return product
      },
    },
    prices: {
      create: async (params: Obj) => {
        guard('prices.create')
        state.calls.push('prices.create')
        const price = { id: `price_${++seq}`, active: true, ...params }
        state.prices.set(price.id, price)
        return price
      },
      update: async (id: string, params: Obj) => {
        guard('prices.update')
        state.calls.push('prices.update')
        const price = state.prices.get(id)
        if (!price) throw missing()
        Object.assign(price, params)
        return price
      },
      retrieve: async (id: string) => {
        const price = state.prices.get(id)
        if (!price) throw missing()
        return price
      },
    },
    checkout: {
      sessions: {
        create: async (params: Obj) => {
          state.checkout.push(params)
          return { url: 'https://stripe.test/checkout' }
        },
      },
    },
  }
  const reset = () => {
    state.products.clear()
    state.prices.clear()
    state.calls.length = 0
    state.checkout.length = 0
    state.fail.clear()
  }
  return { state, stripe, reset }
})

vi.mock('../src/modules/billing/stripe.js', () => ({ stripe: fake.stripe }))

import { Prisma } from '../src/generated/prisma/client.js'
import { productsRepo } from '../src/modules/products/products.repo.js'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  auth,
  createUser,
  grant,
  inProduct,
  loginOk,
  resetDb,
} from './helpers.js'

beforeEach(async () => {
  await resetDb()
  fake.reset()
})

const BODY = {
  slug: 'keyho',
  name: 'Keyho',
  kind: 'product',
  status: 'production',
  shortDescription: 'Property operations platform.',
  description: 'Long description of the platform.',
  categories: ['productivity', 'business'],
  features: ['Task management', 'Scheduling'],
  tagline: 'Streamline property workflows.',
  categoryLabel: 'PropTech · Operations',
  highlights: ['Multi-tenant'],
  capabilities: [{ title: 'Dispatch', description: 'Auto-assign tasks.' }],
  architecture: { stack: ['Next.js'], runtime: 'Docker', deployment: 'Cloud', latency: '<40ms' },
  protocols: ['REST'],
  demoUrl: 'https://demo.example.com',
  sortOrder: 10,
  price: 29,
  currency: 'USD',
  billingPeriod: 'month',
  showPrice: true,
}

const setup = async () => {
  const admin = await createUser('admin', 'admin@test.io')
  const mod = await createUser('moderator', 'mod@test.io')
  await createUser('user', 'buyer@test.io')
  return {
    admin,
    mod,
    tokens: {
      admin: (await loginOk('admin@test.io')).accessToken,
      mod: (await loginOk('mod@test.io')).accessToken,
      buyer: (await loginOk('buyer@test.io')).accessToken,
    },
  }
}

const create = (token: string, body: Record<string, unknown> = {}) =>
  api().post('/api/products').set(auth(token)).send({ ...BODY, ...body })

const patch = (token: string, id: string, body: Record<string, unknown>) =>
  api().patch(`/api/products/${id}`).set(auth(token)).send(body)

const action = (token: string, id: string, path: string) =>
  api().post(`/api/products/${id}/${path}`).set(auth(token)).send({})

const activeStripeProducts = () => [...fake.state.products.values()].filter((p) => p.active)

describe('створення і зв’язок зі Stripe', () => {
  it('створює Stripe-продукт і ціну, id зберігаються 1 до 1', async () => {
    const { tokens } = await setup()

    const res = await create(tokens.admin)

    expect(res.status).toBe(201)
    const product = res.body.product
    expect(product).toMatchObject({
      slug: 'keyho',
      kind: 'product',
      status: 'production',
      showPrice: true,
      isStripeLinked: true,
      isPurchasable: true,
      price: '29',
    })

    const stripeProduct = fake.state.products.get(product.stripeProductId)!
    expect(stripeProduct.metadata.productId).toBe(product.id)
    expect(stripeProduct.name).toBe('Keyho')

    const stripePrice = fake.state.prices.get(product.stripePriceId)!
    expect(stripePrice).toMatchObject({
      product: product.stripeProductId,
      unit_amount: 2900,
      currency: 'usd',
      recurring: { interval: 'month' },
    })

    const row = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(row.stripeProductId).toBe(product.stripeProductId)
    expect(row.stripePriceId).toBe(product.stripePriceId)
  })

  it('суми: копійки для USD, цілі одиниці для JPY, дробові ціни без похибки', async () => {
    const { tokens } = await setup()

    const jpy = await create(tokens.admin, { slug: 'jpy', price: 5000, currency: 'JPY' })
    const cents = await create(tokens.admin, { slug: 'cents', price: 19.99 })

    expect(fake.state.prices.get(jpy.body.product.stripePriceId)!.unit_amount).toBe(5000)
    expect(fake.state.prices.get(cents.body.product.stripePriceId)!.unit_amount).toBe(1999)
  })

  it('агент це той самий тип з іншим kind, у Stripe такий самий продукт', async () => {
    const { tokens } = await setup()

    const res = await create(tokens.admin, { slug: 'voice-ai', kind: 'agent', status: 'build' })

    expect(res.body.product).toMatchObject({ kind: 'agent', status: 'build', isStripeLinked: true })
    expect(fake.state.products.size).toBe(1)
  })

  it('зайнятий slug: 409 і жодного виклику Stripe', async () => {
    const { tokens } = await setup()
    await create(tokens.admin).expect(201)
    const before = fake.state.calls.length

    const res = await create(tokens.admin)

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('SLUG_TAKEN')
    expect(fake.state.calls.length).toBe(before)
  })

  it('збій Stripe при створенні продукту: 502 і нічого в БД', async () => {
    const { tokens } = await setup()
    fake.state.fail.add('products.create')

    const res = await create(tokens.admin)

    expect(res.status).toBe(502)
    expect(res.body.code).toBe('STRIPE_ERROR')
    expect(await prisma.product.count()).toBe(0)
  })

  it('збій Stripe при створенні ціни: продукт у Stripe деактивується, БД порожня', async () => {
    const { tokens } = await setup()
    fake.state.fail.add('prices.create')

    const res = await create(tokens.admin)

    expect(res.status).toBe(502)
    expect(await prisma.product.count()).toBe(0)
    expect(activeStripeProducts()).toHaveLength(0)
  })

  it('гонка з одним slug: виграє один, Stripe-обʼєкти програвшого деактивуються', async () => {
    const { tokens } = await setup()

    const results = await Promise.all([create(tokens.admin), create(tokens.admin), create(tokens.admin)])

    expect(results.filter((r) => r.status === 201)).toHaveLength(1)
    expect(results.filter((r) => r.status === 409)).toHaveLength(2)
    expect(await prisma.product.count()).toBe(1)
    expect(activeStripeProducts()).toHaveLength(1)
  })

  it.each([
    [{ slug: 'Bad Slug' }],
    [{ slug: '-lead' }],
    [{ price: undefined }],
    [{ price: -5 }],
    [{ price: 0 }],
    [{ currency: 'XXX' }],
    [{ billingPeriod: 'decade' }],
    [{ kind: 'service' }],
    [{ status: 'dead' }],
    [{ categories: [] }],
    [{ categories: ['nonsense'] }],
    [{ features: [] }],
    [{ demoUrl: 'javascript:alert(1)' }],
    [{ name: '' }],
  ])('некоректні дані %j відхиляються без звернення до Stripe', async (override) => {
    const { tokens } = await setup()

    const res = await create(tokens.admin, override)

    expect(res.status).toBe(400)
    expect(fake.state.calls).toHaveLength(0)
    expect(await prisma.product.count()).toBe(0)
  })

  it('лише адмін', async () => {
    const { tokens } = await setup()

    expect((await create(tokens.mod)).status).toBe(403)
    expect((await create(tokens.buyer)).status).toBe(403)
    expect((await api().post('/api/products').send(BODY)).status).toBe(401)
    expect(fake.state.calls).toHaveLength(0)
  })

  it('БД не пускає два продукти з одним Stripe-id', async () => {
    const { tokens } = await setup()
    const first = (await create(tokens.admin)).body.product

    await expect(
      prisma.product.create({
        data: {
          slug: 'clone',
          name: 'Clone',
          shortDescription: 's',
          description: 'd',
          categories: ['business'],
          features: ['f'],
          price: 1,
          currency: 'USD',
          billingPeriod: 'month',
          stripeProductId: first.stripeProductId,
        },
      })
    ).rejects.toThrow()
  })
})

describe('відкат Stripe при збої запису в БД', () => {
  it('створення: БД не відповіла після успіху Stripe, Stripe-обʼєкти деактивуються', async () => {
    const { tokens } = await setup()
    const spy = vi.spyOn(productsRepo, 'createProduct').mockRejectedValueOnce(new Error('db down'))

    const res = await create(tokens.admin)
    spy.mockRestore()

    expect(res.status).toBe(500)
    expect(await prisma.product.count()).toBe(0)
    expect(activeStripeProducts()).toHaveLength(0)
    expect([...fake.state.prices.values()].every((price) => !price.active)).toBe(true)
  })

  it('створення: унікальність slug порушена на запису (гонка), результат 409 і відкат у Stripe', async () => {
    const { tokens } = await setup()
    const conflict = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    })
    vi.spyOn(productsRepo, 'createProduct').mockRejectedValueOnce(conflict)

    const res = await create(tokens.admin)
    vi.restoreAllMocks()

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('SLUG_TAKEN')
    expect(activeStripeProducts()).toHaveLength(0)
  })

  it('оновлення: збій БД після нової ціни, нова ціна вимикається, стара лишається, назва у Stripe повертається', async () => {
    const { tokens } = await setup()
    const product = (await create(tokens.admin)).body.product
    vi.spyOn(productsRepo, 'updateProduct').mockRejectedValueOnce(new Error('db down'))

    const res = await patch(tokens.admin, product.id, { name: 'Renamed', price: 99 })
    vi.restoreAllMocks()

    expect(res.status).toBe(500)
    const row = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(row.stripePriceId).toBe(product.stripePriceId)
    expect(fake.state.prices.get(product.stripePriceId)!.active).toBe(true)
    expect(fake.state.products.get(product.stripeProductId)!.name).toBe('Keyho')
    const newPrices = [...fake.state.prices.values()].filter((price) => price.id !== product.stripePriceId)
    expect(newPrices).toHaveLength(1)
    expect(newPrices[0].active).toBe(false)
  })

  it('архівування: збій БД, Stripe-продукт вмикається назад', async () => {
    const { tokens } = await setup()
    const product = (await create(tokens.admin)).body.product
    vi.spyOn(productsRepo, 'setArchivedAt').mockRejectedValueOnce(new Error('db down'))

    const res = await api().delete(`/api/products/${product.id}`).set(auth(tokens.admin))
    vi.restoreAllMocks()

    expect(res.status).toBe(500)
    expect(fake.state.products.get(product.stripeProductId)!.active).toBe(true)
  })
})

describe('оновлення', () => {
  const created = async () => {
    const ctx = await setup()
    const product = (await create(ctx.tokens.admin)).body.product
    fake.state.calls.length = 0
    return { ...ctx, product }
  }

  it('зміна назви й опису оновлює Stripe-продукт, нову ціну не створює', async () => {
    const { tokens, product } = await created()

    const res = await patch(tokens.admin, product.id, { name: 'Keyho Pro', description: 'New text' })

    expect(res.status).toBe(200)
    expect(res.body.product.name).toBe('Keyho Pro')
    expect(fake.state.products.get(product.stripeProductId)).toMatchObject({
      name: 'Keyho Pro',
      description: 'New text',
    })
    expect(fake.state.calls).toEqual(['products.update'])
    expect(res.body.product.stripePriceId).toBe(product.stripePriceId)
  })

  it('зміна ціни: нова ціна у Stripe, стара деактивується, id в БД оновлюється', async () => {
    const { tokens, product } = await created()

    const res = await patch(tokens.admin, product.id, { price: 39, billingPeriod: 'year' })

    expect(res.status).toBe(200)
    expect(res.body.product.price).toBe('39')
    expect(res.body.product.stripePriceId).not.toBe(product.stripePriceId)
    expect(fake.state.prices.get(res.body.product.stripePriceId)).toMatchObject({
      unit_amount: 3900,
      recurring: { interval: 'year' },
      active: true,
    })
    expect(fake.state.prices.get(product.stripePriceId)!.active).toBe(false)
    expect(res.body.product.stripeProductId).toBe(product.stripeProductId)
  })

  it('зміна лише видимості ціни чи сортування не чіпає Stripe', async () => {
    const { tokens, product } = await created()

    const res = await patch(tokens.admin, product.id, { showPrice: false, sortOrder: 5, tagline: 'x' })

    expect(res.status).toBe(200)
    expect(res.body.product).toMatchObject({ showPrice: false, sortOrder: 5, tagline: 'x' })
    expect(fake.state.calls).toHaveLength(0)
  })

  it('часткове оновлення не скидає поля до значень за замовчуванням', async () => {
    const ctx = await setup()
    const agent = (
      await create(ctx.tokens.admin, { slug: 'agent-1', kind: 'agent', status: 'beta', highlights: ['keep'], showPrice: false, sortOrder: 7 })
    ).body.product

    const res = await patch(ctx.tokens.admin, agent.id, { name: 'Renamed' })

    expect(res.body.product).toMatchObject({
      kind: 'agent',
      status: 'beta',
      highlights: ['keep'],
      showPrice: false,
      sortOrder: 7,
      protocols: ['REST'],
    })
  })

  it('null прибирає необов’язкові поля', async () => {
    const { tokens, product } = await created()

    const res = await patch(tokens.admin, product.id, { architecture: null, tagline: null, demoUrl: null })

    expect(res.body.product).toMatchObject({ architecture: null, tagline: null, demoUrl: null })
  })

  it('збій Stripe при оновленні: 502, БД не змінена', async () => {
    const { tokens, product } = await created()
    fake.state.fail.add('products.update')

    const res = await patch(tokens.admin, product.id, { name: 'Nope' })

    expect(res.status).toBe(502)
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).name).toBe('Keyho')
  })

  it('збій створення нової ціни відкочує назву у Stripe і не змінює БД', async () => {
    const { tokens, product } = await created()
    fake.state.fail.add('prices.create')

    const res = await patch(tokens.admin, product.id, { name: 'Renamed', price: 99 })

    expect(res.status).toBe(502)
    expect(fake.state.products.get(product.stripeProductId)!.name).toBe('Keyho')
    const row = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(row.name).toBe('Keyho')
    expect(row.stripePriceId).toBe(product.stripePriceId)
  })

  it('зайнятий slug, архівний, непривʼязаний і неіснуючий продукт', async () => {
    const { tokens, product } = await created()
    await create(tokens.admin, { slug: 'other' }).expect(201)

    expect((await patch(tokens.admin, product.id, { slug: 'other' })).body.code).toBe('SLUG_TAKEN')
    expect((await patch(tokens.admin, 'missing', { name: 'x' })).status).toBe(404)

    const unlinked = await prisma.product.create({
      data: {
        slug: 'unlinked', name: 'U', shortDescription: 's', description: 'd', categories: ['business'],
        features: ['f'], price: 5, currency: 'USD', billingPeriod: 'month',
      },
    })
    expect((await patch(tokens.admin, unlinked.id, { name: 'x' })).body.code).toBe('STRIPE_NOT_LINKED')

    await api().delete(`/api/products/${product.id}`).set(auth(tokens.admin)).expect(200)
    expect((await patch(tokens.admin, product.id, { name: 'x' })).body.code).toBe('PRODUCT_ARCHIVED')
  })

  it('лише адмін', async () => {
    const { tokens, product } = await created()

    expect((await patch(tokens.mod, product.id, { name: 'x' })).status).toBe(403)
  })
})

describe('архівування замість видалення', () => {
  const created = async () => {
    const ctx = await setup()
    const product = (await create(ctx.tokens.admin)).body.product
    return { ...ctx, product }
  }
  const archive = (token: string, id: string) => api().delete(`/api/products/${id}`).set(auth(token))

  it('архів: Stripe-продукт вимикається, на сайті та в оплаті продукту більше немає', async () => {
    const { tokens, product } = await created()

    const res = await archive(tokens.admin, product.id)

    expect(res.status).toBe(200)
    expect(res.body.product.archivedAt).toBeTruthy()
    expect(fake.state.products.get(product.stripeProductId)!.active).toBe(false)
    expect((await api().get('/api/products/keyho')).status).toBe(404)
    expect((await api().get('/api/products/catalog')).body.products).toHaveLength(0)
    const checkout = await api().post('/api/billing/checkout').set(auth(tokens.buyer)).send({ productId: product.id })
    expect(checkout.status).toBe(404)
    // Рядок лишається в БД: остаточно продукти не видаляються.
    expect(await prisma.product.count()).toBe(1)
  })

  it('адмін-список: активні й архівні окремо', async () => {
    const { tokens, product } = await created()
    await create(tokens.admin, { slug: 'second' }).expect(201)
    await archive(tokens.admin, product.id).expect(200)
    const list = (state: string) => api().get('/api/products/admin').query({ state }).set(auth(tokens.admin))

    expect((await list('active')).body.products.map((p: { slug: string }) => p.slug)).toEqual(['second'])
    expect((await list('archived')).body.products.map((p: { slug: string }) => p.slug)).toEqual(['keyho'])
  })

  it('журнал: архівний продукт зникає з перемикачів і не приймає роботу, історія лишається', async () => {
    const { admin, mod, tokens, product } = await created()
    await grant(mod.id, product.id, admin.id)
    const target = await api()
      .post('/api/outreach/targets')
      .set(inProduct(tokens.mod, product.id))
      .send({ value: '@durov' })
      .expect(201)

    await archive(tokens.admin, product.id).expect(200)

    expect((await api().get('/api/me/products').set(auth(tokens.mod))).body.products).toEqual([])
    expect((await api().get('/api/me/products').set(auth(tokens.admin))).body.products).toEqual([])
    expect((await api().post('/api/outreach/check').set(inProduct(tokens.mod, product.id)).send({ value: '@x_user' })).status).toBe(404)
    expect(await prisma.productMembership.count({ where: { productId: product.id } })).toBe(1)
    expect(await prisma.outreachTarget.count({ where: { id: target.body.target.id } })).toBe(1)

    await action(tokens.admin, product.id, 'restore').expect(200)
    expect((await api().get('/api/me/products').set(auth(tokens.mod))).body.products).toHaveLength(1)
  })

  it('відновлення вмикає Stripe-продукт і повертає продукт на сайт', async () => {
    const { tokens, product } = await created()
    await archive(tokens.admin, product.id).expect(200)

    const res = await action(tokens.admin, product.id, 'restore')

    expect(res.status).toBe(200)
    expect(res.body.product.archivedAt).toBeNull()
    expect(fake.state.products.get(product.stripeProductId)!.active).toBe(true)
    expect((await api().get('/api/products/keyho')).status).toBe(200)
  })

  it('повторне архівування й відновлення активного: 409; невідомий 404; лише адмін', async () => {
    const { tokens, product } = await created()

    expect((await action(tokens.admin, product.id, 'restore')).body.code).toBe('NOT_ARCHIVED')
    await archive(tokens.admin, product.id).expect(200)
    expect((await archive(tokens.admin, product.id)).body.code).toBe('ALREADY_ARCHIVED')
    expect((await archive(tokens.admin, 'missing')).status).toBe(404)
    expect((await archive(tokens.mod, product.id)).status).toBe(403)
    expect((await action(tokens.mod, product.id, 'restore')).status).toBe(403)
  })

  it('збій Stripe при архівуванні: 502, продукт лишається активним', async () => {
    const { tokens, product } = await created()
    fake.state.fail.add('products.update')

    const res = await archive(tokens.admin, product.id)

    expect(res.status).toBe(502)
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).archivedAt).toBeNull()
  })
})

describe('синхронізація зі Stripe', () => {
  const unlinked = (extra: Record<string, unknown> = {}) =>
    prisma.product.create({
      data: {
        slug: 'legacy', name: 'Legacy', shortDescription: 's', description: 'Legacy description',
        categories: ['business'], features: ['f'], price: 15, currency: 'USD', billingPeriod: 'month',
        ...extra,
      },
    })
  const sync = (token: string, id: string) => action(token, id, 'stripe-sync')

  it('непривʼязаний продукт отримує Stripe-продукт і ціну', async () => {
    const { tokens } = await setup()
    const legacy = await unlinked()

    const res = await sync(tokens.admin, legacy.id)

    expect(res.status).toBe(200)
    expect(res.body.repaired).toEqual(['product', 'price'])
    expect(res.body.product).toMatchObject({ isStripeLinked: true, isPurchasable: true })
    expect(fake.state.products.get(res.body.product.stripeProductId)!.metadata.productId).toBe(legacy.id)
    expect(fake.state.prices.get(res.body.product.stripePriceId)!.unit_amount).toBe(1500)
  })

  it('повторна синхронізація нічого не створює', async () => {
    const { tokens } = await setup()
    const legacy = await unlinked()
    await sync(tokens.admin, legacy.id).expect(200)
    const before = fake.state.calls.length

    const res = await sync(tokens.admin, legacy.id)

    expect(res.body.repaired).toEqual([])
    expect(fake.state.calls.length).toBe(before)
  })

  it('вимкнена чи розбіжна ціна у Stripe замінюється новою, стара вимикається', async () => {
    const { tokens } = await setup()
    const legacy = await unlinked()
    const linked = (await sync(tokens.admin, legacy.id)).body.product
    // Хтось змінив ціну в БД напряму: сума у Stripe більше не збігається.
    await prisma.product.update({ where: { id: legacy.id }, data: { price: 25 } })

    const res = await sync(tokens.admin, legacy.id)

    expect(res.body.repaired).toEqual(['price'])
    expect(res.body.product.stripePriceId).not.toBe(linked.stripePriceId)
    expect(fake.state.prices.get(res.body.product.stripePriceId)!.unit_amount).toBe(2500)
    expect(fake.state.prices.get(linked.stripePriceId)!.active).toBe(false)
  })

  it('Stripe-продукт зник: створюється наново з новими id', async () => {
    const { tokens } = await setup()
    const legacy = await unlinked()
    const linked = (await sync(tokens.admin, legacy.id)).body.product
    fake.state.products.delete(linked.stripeProductId)

    const res = await sync(tokens.admin, legacy.id)

    expect(res.body.repaired).toEqual(['product', 'price'])
    expect(res.body.product.stripeProductId).not.toBe(linked.stripeProductId)
  })

  it('розбіжна назва чи вимкнений Stripe-продукт вирівнюються', async () => {
    const { tokens } = await setup()
    const legacy = await unlinked()
    const linked = (await sync(tokens.admin, legacy.id)).body.product
    Object.assign(fake.state.products.get(linked.stripeProductId)!, { name: 'Stale', active: false })

    const res = await sync(tokens.admin, legacy.id)

    expect(res.body.repaired).toEqual(['product-info'])
    expect(fake.state.products.get(linked.stripeProductId)).toMatchObject({ name: 'Legacy', active: true })
  })

  it('частково привʼязаний (є продукт, немає ціни) отримує ціну', async () => {
    const { tokens } = await setup()
    const legacy = await unlinked()
    const linked = (await sync(tokens.admin, legacy.id)).body.product
    await prisma.product.update({ where: { id: legacy.id }, data: { stripePriceId: null } })

    const res = await sync(tokens.admin, legacy.id)

    expect(res.body.repaired).toEqual(['price'])
    expect(res.body.product.stripeProductId).toBe(linked.stripeProductId)
    expect(res.body.product.stripePriceId).toBeTruthy()
  })

  it('збій Stripe: 502 і привʼязка не записується; архівний 409; лише адмін', async () => {
    const { tokens } = await setup()
    const legacy = await unlinked()
    fake.state.fail.add('prices.create')

    expect((await sync(tokens.admin, legacy.id)).status).toBe(502)
    expect((await prisma.product.findUniqueOrThrow({ where: { id: legacy.id } })).stripeProductId).toBeNull()
    expect(activeStripeProducts()).toHaveLength(0)

    fake.state.fail.clear()
    expect((await sync(tokens.mod, legacy.id)).status).toBe(403)
    const archived = await unlinked({ slug: 'old', archivedAt: new Date() })
    expect((await sync(tokens.admin, archived.id)).body.code).toBe('PRODUCT_ARCHIVED')
    expect((await sync(tokens.admin, 'missing')).status).toBe(404)
  })
})

describe('публічний каталог і оплата', () => {
  it('каталог: фільтр за kind, порядок за sortOrder, без Stripe-id', async () => {
    const { tokens } = await setup()
    await create(tokens.admin, { slug: 'b-product', name: 'B', sortOrder: 20 }).expect(201)
    await create(tokens.admin, { slug: 'a-product', name: 'A', sortOrder: 10 }).expect(201)
    await create(tokens.admin, { slug: 'an-agent', name: 'Agent', kind: 'agent', sortOrder: 5 }).expect(201)

    const products = await api().get('/api/products/catalog').query({ kind: 'product' })
    const agents = await api().get('/api/products/catalog').query({ kind: 'agent' })
    const all = await api().get('/api/products/catalog')

    expect(products.body.products.map((p: { slug: string }) => p.slug)).toEqual(['a-product', 'b-product'])
    expect(agents.body.products.map((p: { slug: string }) => p.slug)).toEqual(['an-agent'])
    expect(all.body.products).toHaveLength(3)
    expect(JSON.stringify(all.body)).not.toMatch(/stripe|prod_|price_/i)
  })

  it('showPrice=false ховає ціну від відвідувачів, але продукт придатний до оплати', async () => {
    const { tokens } = await setup()
    await create(tokens.admin, { slug: 'hidden', showPrice: false }).expect(201)
    await create(tokens.admin, { slug: 'visible', showPrice: true }).expect(201)

    const hidden = (await api().get('/api/products/hidden')).body.product
    const visible = (await api().get('/api/products/visible')).body.product

    expect(hidden).toMatchObject({ showPrice: false, price: null, currency: null, billingPeriod: null, isPurchasable: true })
    expect(visible).toMatchObject({ showPrice: true, price: '29', currency: 'USD', billingPeriod: 'month', isPurchasable: true })
    const catalog = (await api().get('/api/products/catalog')).body.products
    expect(catalog.find((p: { slug: string }) => p.slug === 'hidden').price).toBeNull()
  })

  it('адмін бачить справжню ціну й Stripe-id незалежно від showPrice', async () => {
    const { tokens } = await setup()
    await create(tokens.admin, { slug: 'hidden', showPrice: false }).expect(201)

    const list = (await api().get('/api/products/admin').set(auth(tokens.admin))).body.products

    expect(list[0]).toMatchObject({ price: '29', showPrice: false, isStripeLinked: true })
    expect(list[0].stripeProductId).toMatch(/^prod_/)
  })

  it('сторінка продукту віддає повний вміст без Stripe-id', async () => {
    const { tokens } = await setup()
    await create(tokens.admin).expect(201)

    const product = (await api().get('/api/products/keyho')).body.product

    expect(product).toMatchObject({
      name: 'Keyho',
      tagline: 'Streamline property workflows.',
      capabilities: [{ title: 'Dispatch', description: 'Auto-assign tasks.' }],
      architecture: { runtime: 'Docker' },
      protocols: ['REST'],
    })
    expect(product.stripeProductId).toBeUndefined()
    expect(product.stripePriceId).toBeUndefined()
  })

  it('оплата: Stripe Checkout з ціною продукту; без ціни у Stripe 409', async () => {
    const { tokens } = await setup()
    const product = (await create(tokens.admin).then((r) => r.body.product)) as { id: string; stripePriceId: string }

    const ok = await api().post('/api/billing/checkout').set(auth(tokens.buyer)).send({ productId: product.id })

    expect(ok.status).toBe(200)
    expect(ok.body.url).toBe('https://stripe.test/checkout')
    expect(fake.state.checkout[0].line_items[0].price).toBe(product.stripePriceId)
    expect(fake.state.checkout[0].metadata.productId).toBe(product.id)

    const bare = await prisma.product.create({
      data: {
        slug: 'bare', name: 'Bare', shortDescription: 's', description: 'd', categories: ['business'],
        features: ['f'], price: 5, currency: 'USD', billingPeriod: 'month',
      },
    })
    const blocked = await api().post('/api/billing/checkout').set(auth(tokens.buyer)).send({ productId: bare.id })
    expect(blocked.status).toBe(409)
    expect(blocked.body.code).toBe('NOT_PURCHASABLE')
  })

  it('невідомий slug 404, без токена публічні ендпоінти працюють', async () => {
    expect((await api().get('/api/products/nope')).status).toBe(404)
    expect((await api().get('/api/products/catalog')).status).toBe(200)
  })
})
