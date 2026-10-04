import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  auth,
  createProduct,
  createUser,
  loginOk,
  resetDb,
} from './helpers.js'
import { libraryStatus } from '../src/modules/account/account.service.js'

beforeEach(resetDb)

const buyer = async () => {
  const user = await createUser('user', 'buyer@test.io')
  const { accessToken } = await loginOk('buyer@test.io')
  return { user, token: accessToken }
}

describe('кабінет клієнта: профіль і мова', () => {
  it('потрібен вхід', async () => {
    expect((await api().get('/api/account')).status).toBe(401)
    expect(
      (await api().patch('/api/account').send({ locale: 'es' })).status
    ).toBe(401)
  })

  it('профіль за замовчуванням англійською, мову можна змінити й вона зберігається', async () => {
    const { token } = await buyer()

    const before = (await api().get('/api/account').set(auth(token))).body
      .profile
    expect(before).toMatchObject({
      email: 'buyer@test.io',
      role: 'user',
      locale: 'en',
    })

    await api()
      .patch('/api/account')
      .set(auth(token))
      .send({ locale: 'uk', name: 'Олена' })
      .expect(200)

    const after = (await api().get('/api/account').set(auth(token))).body
      .profile
    expect(after).toMatchObject({ locale: 'uk', name: 'Олена' })
  })

  it('відхиляє невідому мову, порожній запит і поля, яких змінювати не можна', async () => {
    const { token } = await buyer()

    await api()
      .patch('/api/account')
      .set(auth(token))
      .send({ locale: 'fr' })
      .expect(400)
    await api().patch('/api/account').set(auth(token)).send({}).expect(400)
    await api()
      .patch('/api/account')
      .set(auth(token))
      .send({ role: 'admin' })
      .expect(400)
  })

  it('реєстрація зберігає мову сайту; вхід повертає її у профілі користувача', async () => {
    await api()
      .post('/api/auth/register')
      .send({
        email: 'es@test.io',
        name: 'Eva',
        password: 'password-123',
        confirmPassword: 'password-123',
        locale: 'es',
      })
      .expect(201)

    const login = await api()
      .post('/api/auth/login')
      .send({ email: 'es@test.io', password: 'password-123' })

    expect(login.body.user.locale).toBe('es')
  })

  it('реєстрація без мови дає англійську', async () => {
    await api()
      .post('/api/auth/register')
      .send({
        email: 'en@test.io',
        name: 'Al',
        password: 'password-123',
        confirmPassword: 'password-123',
      })
      .expect(201)

    expect(
      (await prisma.user.findUniqueOrThrow({ where: { email: 'en@test.io' } }))
        .locale
    ).toBe('en')
  })
})

describe('кабінет клієнта: покупки', () => {
  const grantLibrary = (
    userId: string,
    productId: string,
    extra: Record<string, unknown> = {}
  ) =>
    prisma.userLibrary.create({
      data: {
        userId,
        productId,
        subscriptionId: `sub_${Math.random()}`,
        ...extra,
      },
    })

  it('віддає лише власні покупки, з локалізованим продуктом і статусом', async () => {
    const { user, token } = await buyer()
    const other = await createUser('user', 'other@test.io')
    const product = await createProduct('Keyho')
    await prisma.product.update({
      where: { id: product.id },
      data: {
        translations: {
          es: {
            name: 'Keyho ES',
            shortDescription: 'corto',
            description: 'largo',
          },
        },
      },
    })
    await grantLibrary(user.id, product.id)
    await grantLibrary(other.id, (await createProduct('Secret')).id)

    const res = await api()
      .get('/api/account/library')
      .query({ lang: 'es' })
      .set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0]).toMatchObject({
      status: 'active',
      product: { name: 'Keyho ES' },
    })
    expect(JSON.stringify(res.body)).not.toMatch(/stripe/i)
  })

  it('статус: діє, скасовано з оплаченим періодом, завершено', () => {
    const now = new Date('2026-06-01T00:00:00Z')
    const future = new Date('2026-07-01T00:00:00Z')
    const past = new Date('2026-05-01T00:00:00Z')

    expect(
      libraryStatus({ canceledAt: null, accessExpiresAt: future }, now)
    ).toBe('active')
    expect(
      libraryStatus({ canceledAt: null, accessExpiresAt: null }, now)
    ).toBe('active')
    expect(
      libraryStatus({ canceledAt: past, accessExpiresAt: future }, now)
    ).toBe('canceled')
    expect(
      libraryStatus({ canceledAt: past, accessExpiresAt: past }, now)
    ).toBe('expired')
    expect(
      libraryStatus({ canceledAt: null, accessExpiresAt: past }, now)
    ).toBe('expired')
  })
})

describe('кабінет клієнта: збережені', () => {
  it('віддає збережені без Stripe-даних і ховає архівні', async () => {
    const { user, token } = await buyer()
    const live = await createProduct('Live')
    const archived = await createProduct('Archived')
    await prisma.savedProduct.createMany({
      data: [
        { userId: user.id, productId: live.id },
        { userId: user.id, productId: archived.id },
      ],
    })
    await prisma.product.update({
      where: { id: archived.id },
      data: { archivedAt: new Date() },
    })

    const res = await api().get('/api/account/saved').set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.products.map((p: { id: string }) => p.id)).toEqual([
      live.id,
    ])
    expect(res.body.products[0].isSaved).toBe(true)
    expect(JSON.stringify(res.body)).not.toMatch(/stripe/i)
  })
})
