import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const remote = vi.hoisted(() => ({
  subscriptions: new Map<string, any>(),
  prices: new Map<string, any>(),
  sequence: 0,
}))
vi.mock('../src/modules/billing/stripe.js', async () => {
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe('sk_test_audit')
  stripe.subscriptions.retrieve = vi.fn(async (id: string) =>
    remote.subscriptions.get(id)
  ) as any
  stripe.products.update = vi.fn(async () => ({})) as any
  stripe.prices.create = vi.fn(async (data: any) => {
    const price = {
      id: `price_audit_${++remote.sequence}`,
      active: true,
      ...data,
    }
    remote.prices.set(price.id, price)
    return price
  }) as any
  stripe.prices.update = vi.fn(async () => ({})) as any
  return { stripe }
})

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
import { prisma } from '../src/shared/database/prisma.js'
import { billingService } from '../src/modules/billing/billing.service.js'
import { productsService } from '../src/modules/products/products.service.js'
import { sessionRepo } from '../src/modules/auth/repos/session.repo.js'
import { targetsRepo } from '../src/modules/outreach/targets.repo.js'

beforeEach(async () => {
  await resetDb()
  remote.subscriptions.clear()
  remote.prices.clear()
  vi.stubEnv('REVALIDATE_SECRET', '')
  vi.stubEnv('NOTIFICATIONS_SERVICE_URL', 'https://notifications.example.test')
  vi.stubEnv('NOTIFICATIONS_SERVICE_SECRET', 'audit-secret')
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status: 200 }))
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const accounts = async () => {
  const admin = await createUser('admin', 'admin@example.test')
  const buyer = await createUser('user', 'buyer@example.test')
  const moderator = await createUser('moderator', 'moderator@example.test')
  return {
    admin,
    buyer,
    moderator,
    a: await loginOk(admin.email),
    b: await loginOk(buyer.email),
    m: await loginOk(moderator.email),
  }
}

describe('audit access and session regressions', () => {
  it('only administrators can list accounts; response includes only allowed fields', async () => {
    const { a, b, m } = await accounts()
    await api().get('/api/users').set(auth(b.accessToken)).expect(403)
    await api().get('/api/users').set(auth(m.accessToken)).expect(403)
    const listed = await api()
      .get('/api/users')
      .set(auth(a.accessToken))
      .expect(200)
    expect(Object.keys(listed.body.users[0]).sort()).toEqual(
      ['id', 'email', 'name', 'role', 'createdAt', 'deactivatedAt'].sort()
    )
    const cursor = listed.body.users[0]
    await api()
      .get('/api/users')
      .query({ lastId: cursor.id, lastCreatedAt: cursor.createdAt })
      .set(auth(a.accessToken))
      .expect(200)
  })

  it('last administrator cannot be demoted; successful changes are audited', async () => {
    const { admin, buyer, a } = await accounts()
    const denied = await api()
      .patch(`/api/users/${admin.id}`)
      .set(auth(a.accessToken))
      .send({ role: 'user' })
      .expect(409)
    expect(denied.body.code).toBe('LAST_ADMIN')
    await api()
      .patch(`/api/users/${buyer.id}`)
      .set(auth(a.accessToken))
      .send({ role: 'admin' })
      .expect(200)
    await api()
      .patch(`/api/users/${admin.id}`)
      .set(auth(a.accessToken))
      .send({ role: 'user' })
      .expect(200)
    expect(
      await prisma.auditEvent.count({ where: { action: 'user_role_changed' } })
    ).toBe(2)
  })

  it('parallel admin demotions leave at least one active administrator', async () => {
    const first = await createUser('admin', 'first@example.test')
    const second = await createUser('admin', 'second@example.test')
    const [a, b] = await Promise.all([
      loginOk(first.email),
      loginOk(second.email),
    ])
    const results = await Promise.all([
      api()
        .patch(`/api/users/${first.id}`)
        .set(auth(a.accessToken))
        .send({ role: 'user' }),
      api()
        .patch(`/api/users/${second.id}`)
        .set(auth(b.accessToken))
        .send({ role: 'user' }),
    ])
    expect(results.map((r) => r.status).sort()).toEqual([200, 409])
    expect(
      await prisma.user.count({ where: { role: 'admin', deactivatedAt: null } })
    ).toBe(1)
  })

  it('concurrent refresh requests issue only one successor', async () => {
    const user = await createUser('user', 'refresh@example.test')
    const logged = await loginOk(user.email)
    const cookie = logged
      .cookies!.map((value) => value.split(';')[0])
      .join('; ')
    const replies = await Promise.all([
      api().post('/api/auth/refresh').set('Cookie', cookie),
      api().post('/api/auth/refresh').set('Cookie', cookie),
    ])
    expect(replies.map((r) => r.status).sort()).toEqual([200, 401])
    expect(
      replies.find((r) => r.status === 401)!.headers['set-cookie']
    ).toBeUndefined()
    expect(
      await prisma.refreshToken.count({ where: { revokedAt: null } })
    ).toBe(1)
  })

  it('a failed successor write rolls back refresh consumption', async () => {
    const user = await createUser('user', 'rollback@example.test')
    const logged = await loginOk(user.email)
    const cookie = logged
      .cookies!.map((value) => value.split(';')[0])
      .join('; ')
    const spy = vi
      .spyOn(sessionRepo, 'createRefresh')
      .mockRejectedValueOnce(new Error('write failed'))
    await api().post('/api/auth/refresh').set('Cookie', cookie).expect(500)
    spy.mockRestore()
    await api().post('/api/auth/refresh').set('Cookie', cookie).expect(200)
  })

  it('invalid calendar dates return 400', async () => {
    const { a } = await accounts()
    for (const date of ['2026-99-99', '2026-02-30', 'bad-date']) {
      await api()
        .get('/api/reports')
        .query({ date })
        .set(auth(a.accessToken))
        .expect(400)
    }
  })

  it('saved products hide prices and Stripe identifiers and exclude archived items', async () => {
    const { buyer, b } = await accounts()
    const product = await createProduct('Hidden')
    await prisma.product.update({
      where: { id: product.id },
      data: { showPrice: false, stripePriceId: 'price_hidden' },
    })
    await prisma.savedProduct.create({
      data: { userId: buyer.id, productId: product.id },
    })
    const saved = await api()
      .get('/api/products/saved')
      .set(auth(b.accessToken))
      .expect(200)
    expect(saved.body.products[0].product.price).toBeNull()
    expect(saved.body.products[0].product).not.toHaveProperty('stripePriceId')
    expect(saved.body.products[0].product).not.toHaveProperty('stripeProductId')
    await prisma.product.update({
      where: { id: product.id },
      data: { archivedAt: new Date() },
    })
    const archived = await api()
      .get('/api/products/saved')
      .set(auth(b.accessToken))
      .expect(200)
    expect(archived.body.products).toEqual([])
  })

  it('parallel price and currency edits agree with the final Stripe price', async () => {
    const product = await createProduct('Concurrent')
    await prisma.product.update({
      where: { id: product.id },
      data: {
        stripeProductId: 'prod_audit',
        stripePriceId: 'price_old',
        price: 10,
        currency: 'USD',
      },
    })
    await Promise.all([
      productsService.updateProduct(product.id, { price: 20 }),
      productsService.updateProduct(product.id, { currency: 'EUR' }),
    ])
    const current = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    })
    expect(current.price.toString()).toBe('20')
    expect(current.currency).toBe('EUR')
    expect(remote.prices.get(current.stripePriceId!)).toMatchObject({
      currency: 'eur',
      unit_amount: 2000,
    })
  })

  it('an identifier write rechecks ownership after a concurrent transfer commits', async () => {
    const { admin, moderator, m } = await accounts()
    const recipient = await createUser('moderator', 'recipient@example.test')
    const product = await createProduct()
    await grant(moderator.id, product.id, admin.id)
    const target = await prisma.outreachTarget.create({
      data: {
        productId: product.id,
        ownerUserId: moderator.id,
        displayName: 'Target',
      },
    })
    let locked!: () => void, release!: () => void, entered!: () => void
    const ready = new Promise<void>((r) => {
      locked = r
    })
    const held = new Promise<void>((r) => {
      release = r
    })
    const waiting = new Promise<void>((r) => {
      entered = r
    })
    const original = targetsRepo.lockTarget
    vi.spyOn(targetsRepo, 'lockTarget').mockImplementation(async (...args) => {
      entered()
      return original(...args)
    })
    const transfer = prisma.$transaction(async (tx) => {
      await tx.outreachTarget.update({
        where: { id: target.id },
        data: { ownerUserId: recipient.id },
      })
      locked()
      await held
    })
    await ready
    const writing = api()
      .post(`/api/outreach/targets/${target.id}/identifiers`)
      .set(inProduct(m.accessToken, product.id))
      .send({ channel: 'email', value: 'contact@example.test' })
      .then((r) => r)
    await waiting
    release()
    await transfer
    expect((await writing).status).toBe(403)
    expect(
      await prisma.outreachIdentifier.count({ where: { targetId: target.id } })
    ).toBe(0)
  })
})

const subscriptionFixture = async () => {
  const buyer = await createUser('user', 'paid@example.test')
  const product = await createProduct('Paid product')
  const subscription = {
    id: 'sub_audit',
    metadata: { userId: buyer.id, productId: product.id },
    status: 'active',
    cancel_at: null,
    cancel_at_period_end: false,
    items: {
      data: [
        { current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30 },
      ],
    },
  }
  remote.subscriptions.set(subscription.id, subscription)
  return { buyer, product, subscription }
}
const event = (id: string, type: string, object: any): any => ({
  id,
  type,
  data: { object },
})
const invoice = () => ({
  id: 'in_audit',
  parent: { subscription_details: { subscription: 'sub_audit' } },
  lines: {
    data: [
      {
        subscription: 'sub_audit',
        period: {
          end: remote.subscriptions.get('sub_audit').items.data[0]
            .current_period_end,
        },
      },
    ],
  },
})

describe('Stripe payment lifecycle', () => {
  it('paid checkout and repeated invoices grant access once and send one welcome email', async () => {
    const { buyer, product } = await subscriptionFixture()
    const paid = event('evt_paid', 'invoice.paid', invoice())
    await Promise.all([
      billingService.handleWebhookEvent(paid),
      billingService.handleWebhookEvent(paid),
    ])
    await billingService.handleWebhookEvent(
      event('evt_checkout', 'checkout.session.completed', {
        id: 'cs_audit',
        subscription: 'sub_audit',
        payment_status: 'paid',
      })
    )
    expect(await prisma.userLibrary.count()).toBe(1)
    expect(await prisma.userLibrary.findFirst()).toMatchObject({
      userId: buyer.id,
      productId: product.id,
      stripeSubscriptionId: 'sub_audit',
    })
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    ).toMatchObject({ to: buyer.email, productName: product.name })
  })

  it('subscription updates do not extend unpaid access; paid invoices do', async () => {
    const { subscription } = await subscriptionFixture()
    await billingService.handleWebhookEvent(
      event('evt_first', 'invoice.paid', invoice())
    )
    const first = await prisma.userLibrary.findFirstOrThrow()
    subscription.items.data[0].current_period_end += 86400 * 30
    await billingService.handleWebhookEvent(
      event('evt_update', 'customer.subscription.updated', subscription)
    )
    expect(
      (await prisma.userLibrary.findFirstOrThrow()).accessExpiresAt
    ).toEqual(first.accessExpiresAt)
    await billingService.handleWebhookEvent(
      event('evt_renew', 'invoice.paid', invoice())
    )
    expect(
      (await prisma.userLibrary.findFirstOrThrow()).accessExpiresAt!.getTime()
    ).toBeGreaterThan(first.accessExpiresAt!.getTime())
  })

  it('a late paid invoice cannot resurrect a deleted subscription', async () => {
    const { subscription } = await subscriptionFixture()
    await billingService.handleWebhookEvent(
      event('evt_first', 'invoice.paid', invoice())
    )
    subscription.status = 'canceled'
    await billingService.handleWebhookEvent(
      event('evt_deleted', 'customer.subscription.deleted', subscription)
    )
    await billingService.handleWebhookEvent(
      event('evt_late', 'invoice.paid', invoice())
    )
    expect(
      (await prisma.userLibrary.findFirstOrThrow()).accessExpiresAt!.getTime()
    ).toBeLessThanOrEqual(Date.now())
  })

  it('an old paid invoice cannot grant the current unpaid billing period', async () => {
    const { subscription } = await subscriptionFixture()
    const oldInvoice = invoice()
    await billingService.handleWebhookEvent(
      event('evt_initial', 'invoice.paid', oldInvoice)
    )
    const paidUntil = (await prisma.userLibrary.findFirstOrThrow())
      .accessExpiresAt
    subscription.items.data[0].current_period_end += 86400 * 30
    subscription.status = 'past_due'
    await billingService.handleWebhookEvent(
      event('evt_old_invoice', 'invoice.paid', oldInvoice)
    )
    expect(
      (await prisma.userLibrary.findFirstOrThrow()).accessExpiresAt
    ).toEqual(paidUntil)
  })

  it('failed notification delivery is retried without duplicating access', async () => {
    const { buyer } = await subscriptionFixture()
    const paid = event('evt_retry', 'invoice.paid', invoice())
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 503 }))
    await expect(billingService.handleWebhookEvent(paid)).rejects.toMatchObject(
      { code: 'NOTIFICATION_FAILED' }
    )
    expect(await prisma.userLibrary.count()).toBe(1)
    await billingService.handleWebhookEvent(paid)
    await billingService.handleWebhookEvent(paid)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
    const options = vi.mocked(fetch).mock.calls[1][1]!
    expect(options.headers).toMatchObject({ 'idempotency-key': 'evt_retry' })
    expect(JSON.parse(options.body as string).to).toBe(buyer.email)
  })

  it('failed payments notify the actual buyer without granting access', async () => {
    const { buyer } = await subscriptionFixture()
    await billingService.handleWebhookEvent(
      event('evt_failed', 'invoice.payment_failed', invoice())
    )
    expect(await prisma.userLibrary.count()).toBe(0)
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).to
    ).toBe(buyer.email)
  })
})
