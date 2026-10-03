import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  auth,
  createProduct,
  createUser,
  login,
  loginOk,
  resetDb,
} from './helpers.js'

beforeEach(resetDb)

const setup = async () => {
  const adminUser = await createUser('admin', 'admin@test.io')
  const moderator = await createUser('moderator', 'mod@test.io')
  const product = await createProduct('A')
  const other = await createProduct('B')
  const admin = await loginOk('admin@test.io')
  return { adminUser, moderator, product, other, admin }
}

describe('team: порожня БД і доступ до екрана', () => {
  it('список модераторів на БД без модераторів не падає', async () => {
    await createUser('admin', 'admin@test.io')
    const { accessToken } = await loginOk('admin@test.io')

    const res = await api().get('/api/team/moderators').set(auth(accessToken))

    expect(res.status).toBe(200)
    expect(res.body.moderators).toEqual([])
  })

  it('без токена 401, модератор і покупець отримують 403', async () => {
    await createUser('moderator', 'mod@test.io')
    await createUser('user', 'buyer@test.io')

    expect((await api().get('/api/team/moderators')).status).toBe(401)

    for (const email of ['mod@test.io', 'buyer@test.io']) {
      const { accessToken } = await loginOk(email)
      const res = await api().get('/api/team/moderators').set(auth(accessToken))
      expect(res.status).toBe(403)
    }
  })

  it('модератор не може сам собі додати продукт', async () => {
    const { moderator, product } = await setup()
    const { accessToken } = await loginOk('mod@test.io')

    const res = await api()
      .post(`/api/team/moderators/${moderator.id}/products`)
      .set(auth(accessToken))
      .send({ productId: product.id })

    expect(res.status).toBe(403)
    expect(await prisma.productMembership.count()).toBe(0)
  })
})

describe('team: створення модератора і пароль', () => {
  it('адмін створює модератора, той входить; дубль e-mail (будь-який регістр) 409', async () => {
    const { admin } = await setup()

    const created = await api()
      .post('/api/team/moderators')
      .set(auth(admin.accessToken))
      .send({ email: 'New.Mod@test.io', name: 'New', password: 'secret-pass-1' })

    expect(created.status).toBe(201)
    expect(created.body.moderator).toMatchObject({ email: 'New.Mod@test.io' })
    expect(JSON.stringify(created.body)).not.toContain('secret-pass-1')

    expect((await login('New.Mod@test.io', 'secret-pass-1')).status).toBe(200)

    const dup = await api()
      .post('/api/team/moderators')
      .set(auth(admin.accessToken))
      .send({ email: 'new.mod@test.io', name: 'Dup', password: 'secret-pass-1' })
    expect(dup.status).toBe(409)
  })

  it('короткий пароль відхиляється', async () => {
    const { admin } = await setup()

    const res = await api()
      .post('/api/team/moderators')
      .set(auth(admin.accessToken))
      .send({ email: 'x@test.io', name: 'X', password: 'short' })

    expect(res.status).toBe(400)
  })

  it('зміна пароля завершує старі сесії, старий пароль більше не діє', async () => {
    const { moderator, admin } = await setup()
    const session = await loginOk('mod@test.io')

    const res = await api()
      .patch(`/api/team/moderators/${moderator.id}/password`)
      .set(auth(admin.accessToken))
      .send({ password: 'brand-new-pass' })
    expect(res.status).toBe(200)

    const old = await api().get('/api/me/products').set(auth(session.accessToken))
    expect(old.status).toBe(401)
    expect((await login('mod@test.io', 'password-123')).status).toBe(401)
    expect((await login('mod@test.io', 'brand-new-pass')).status).toBe(200)
  })

  it('пароль не потрапляє в аудит', async () => {
    const { moderator, admin } = await setup()

    await api()
      .patch(`/api/team/moderators/${moderator.id}/password`)
      .set(auth(admin.accessToken))
      .send({ password: 'very-secret-pass' })

    const events = await prisma.auditEvent.findMany()
    expect(events.map((e) => e.action)).toContain('password_reset')
    expect(JSON.stringify(events)).not.toContain('very-secret-pass')
  })

  it('адмін не може керувати не-модератором через team', async () => {
    const { adminUser, admin } = await setup()

    const res = await api()
      .post(`/api/team/moderators/${adminUser.id}/deactivate`)
      .set(auth(admin.accessToken))

    expect(res.status).toBe(404)
  })
})

describe('requireProduct і членства', () => {
  it('модератор бачить лише свої продукти; чужий 403, невідомий 404, без заголовка 400', async () => {
    const { moderator, product, other, admin } = await setup()
    await api()
      .post(`/api/team/moderators/${moderator.id}/products`)
      .set(auth(admin.accessToken))
      .send({ productId: product.id })
      .expect(201)

    const { accessToken } = await loginOk('mod@test.io')

    const mine = await api().get('/api/me/products').set(auth(accessToken))
    expect(mine.body.products.map((p: { id: string }) => p.id)).toEqual([
      product.id,
    ])

    const ok = await api()
      .get('/api/me/context')
      .set(auth(accessToken))
      .set('X-Product-Id', product.id)
    expect(ok.status).toBe(200)
    expect(ok.body.productId).toBe(product.id)

    const foreign = await api()
      .get('/api/me/context')
      .set(auth(accessToken))
      .set('X-Product-Id', other.id)
    expect(foreign.status).toBe(403)

    const unknown = await api()
      .get('/api/me/context')
      .set(auth(accessToken))
      .set('X-Product-Id', 'does-not-exist')
    expect(unknown.status).toBe(404)

    const missing = await api().get('/api/me/context').set(auth(accessToken))
    expect(missing.status).toBe(400)
  })

  it('адмін проходить у будь-який продукт і бачить усі', async () => {
    const { product, other, admin } = await setup()

    for (const p of [product, other]) {
      const res = await api()
        .get('/api/me/context')
        .set(auth(admin.accessToken))
        .set('X-Product-Id', p.id)
      expect(res.status).toBe(200)
    }

    const all = await api().get('/api/me/products').set(auth(admin.accessToken))
    expect(all.body.products).toHaveLength(2)
  })

  it('покупець (role user) не має доступу до продуктів журналу', async () => {
    const { product } = await setup()
    await createUser('user', 'buyer@test.io')
    const { accessToken } = await loginOk('buyer@test.io')

    const res = await api()
      .get('/api/me/context')
      .set(auth(accessToken))
      .set('X-Product-Id', product.id)

    expect(res.status).toBe(403)
  })

  it('забраний доступ діє одразу, слід лишається, повторна видача працює', async () => {
    const { moderator, product, admin } = await setup()
    const grant = () =>
      api()
        .post(`/api/team/moderators/${moderator.id}/products`)
        .set(auth(admin.accessToken))
        .send({ productId: product.id })
    const probe = (token: string) =>
      api()
        .get('/api/me/context')
        .set(auth(token))
        .set('X-Product-Id', product.id)

    await grant().expect(201)
    const { accessToken } = await loginOk('mod@test.io')
    expect((await probe(accessToken)).status).toBe(200)

    const revoke = await api()
      .delete(`/api/team/moderators/${moderator.id}/products/${product.id}`)
      .set(auth(admin.accessToken))
    expect(revoke.status).toBe(200)

    expect((await probe(accessToken)).status).toBe(403)
    const mine = await api().get('/api/me/products').set(auth(accessToken))
    expect(mine.body.products).toEqual([])

    const rows = await prisma.productMembership.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0].revokedAt).not.toBeNull()
    expect(rows[0].revokedById).toBe((await prisma.user.findFirstOrThrow({ where: { role: 'admin' } })).id)

    await grant().expect(201)
    expect((await probe(accessToken)).status).toBe(200)
    expect(await prisma.productMembership.count()).toBe(2)
  })

  it('зміна одного продукту не торкається решти', async () => {
    const { moderator, product, other, admin } = await setup()
    for (const p of [product, other]) {
      await api()
        .post(`/api/team/moderators/${moderator.id}/products`)
        .set(auth(admin.accessToken))
        .send({ productId: p.id })
        .expect(201)
    }

    await api()
      .delete(`/api/team/moderators/${moderator.id}/products/${product.id}`)
      .set(auth(admin.accessToken))
      .expect(200)

    const { accessToken } = await loginOk('mod@test.io')
    const mine = await api().get('/api/me/products').set(auth(accessToken))
    expect(mine.body.products.map((p: { id: string }) => p.id)).toEqual([
      other.id,
    ])
  })

  it('подвійна видача 409, неіснуючий продукт 404, забирання невиданого 404', async () => {
    const { moderator, product, admin } = await setup()
    const grant = (productId: string) =>
      api()
        .post(`/api/team/moderators/${moderator.id}/products`)
        .set(auth(admin.accessToken))
        .send({ productId })

    await grant(product.id).expect(201)
    expect((await grant(product.id)).status).toBe(409)
    expect((await grant('nope')).status).toBe(404)

    const other = await createProduct('C')
    const revoke = await api()
      .delete(`/api/team/moderators/${moderator.id}/products/${other.id}`)
      .set(auth(admin.accessToken))
    expect(revoke.status).toBe(404)
  })

  it('гонка: дві одночасні видачі дають одну активну пару', async () => {
    const { moderator, product, admin } = await setup()
    const grant = () =>
      api()
        .post(`/api/team/moderators/${moderator.id}/products`)
        .set(auth(admin.accessToken))
        .send({ productId: product.id })

    const results = await Promise.all([grant(), grant(), grant()])

    expect(results.filter((r) => r.status === 201)).toHaveLength(1)
    expect(results.filter((r) => r.status === 409)).toHaveLength(2)
    expect(
      await prisma.productMembership.count({ where: { revokedAt: null } })
    ).toBe(1)
  })

  it('список команди показує активні продукти модератора', async () => {
    const { moderator, product, other, admin } = await setup()
    for (const p of [product, other]) {
      await api()
        .post(`/api/team/moderators/${moderator.id}/products`)
        .set(auth(admin.accessToken))
        .send({ productId: p.id })
    }
    await api()
      .delete(`/api/team/moderators/${moderator.id}/products/${other.id}`)
      .set(auth(admin.accessToken))

    const res = await api().get('/api/team/moderators').set(auth(admin.accessToken))

    expect(res.body.moderators).toHaveLength(1)
    expect(res.body.moderators[0].products.map((p: { id: string }) => p.id)).toEqual([product.id])
    expect(res.body.moderators[0]).not.toHaveProperty('credentials')
  })
})

describe('деактивація', () => {
  it('відкрита сесія завершується одразу, вхід і refresh заборонені', async () => {
    const { moderator, admin } = await setup()
    const session = await loginOk('mod@test.io')
    expect((await api().get('/api/me/products').set(auth(session.accessToken))).status).toBe(200)

    await api()
      .post(`/api/team/moderators/${moderator.id}/deactivate`)
      .set(auth(admin.accessToken))
      .expect(200)

    const after = await api().get('/api/me/products').set(auth(session.accessToken))
    expect(after.status).toBe(401)

    expect((await login('mod@test.io')).status).toBe(401)

    const refresh = await api()
      .post('/api/auth/refresh')
      .set('Cookie', session.cookies ?? [])
    expect(refresh.status).toBe(401)
  })

  it('повернення акаунта відновлює членства', async () => {
    const { moderator, product, admin } = await setup()
    await api()
      .post(`/api/team/moderators/${moderator.id}/products`)
      .set(auth(admin.accessToken))
      .send({ productId: product.id })
      .expect(201)

    await api().post(`/api/team/moderators/${moderator.id}/deactivate`).set(auth(admin.accessToken)).expect(200)
    await api().post(`/api/team/moderators/${moderator.id}/activate`).set(auth(admin.accessToken)).expect(200)

    const { accessToken } = await loginOk('mod@test.io')
    const res = await api()
      .get('/api/me/context')
      .set(auth(accessToken))
      .set('X-Product-Id', product.id)
    expect(res.status).toBe(200)
  })

  it('деактивований адмін теж втрачає доступ', async () => {
    await createUser('admin', 'admin@test.io')
    const { accessToken } = await loginOk('admin@test.io')
    await prisma.user.updateMany({ data: { deactivatedAt: new Date() } })

    const res = await api().get('/api/team/moderators').set(auth(accessToken))
    expect(res.status).toBe(401)
  })
})

describe('роль береться з БД, а не з токена', () => {
  it('понижений адмін одразу втрачає права, хоч токен ще чинний', async () => {
    const { adminUser, admin } = await setup()

    await prisma.user.update({ where: { id: adminUser.id }, data: { role: 'user' } })

    const res = await api().get('/api/team/moderators').set(auth(admin.accessToken))
    expect(res.status).toBe(403)
  })

  it('токен з підробленою роллю не діє', async () => {
    await createUser('moderator', 'mod@test.io')
    const jwt = (await import('jsonwebtoken')).default
    const real = await loginOk('mod@test.io')
    const payload = jwt.decode(real.accessToken) as { id: string; email: string; sessionId: string }
    const forged = jwt.sign({ ...payload, role: 'admin' }, 'wrong-secret')

    const res = await api().get('/api/team/moderators').set(auth(forged))
    expect(res.status).toBe(401)

    // Правильний підпис, але роль admin у payload: сервер усе одно бере роль із БД.
    const signed = jwt.sign({ ...payload, role: 'admin' }, process.env.JWT_SECRET!)
    const res2 = await api().get('/api/team/moderators').set(auth(signed))
    expect(res2.status).toBe(403)
  })
})

describe('аудит', () => {
  it('усі дії адміна пишуться в audit_events', async () => {
    const { moderator, product, admin } = await setup()
    const a = auth(admin.accessToken)

    await api().post(`/api/team/moderators/${moderator.id}/products`).set(a).send({ productId: product.id })
    await api().delete(`/api/team/moderators/${moderator.id}/products/${product.id}`).set(a)
    await api().post(`/api/team/moderators/${moderator.id}/deactivate`).set(a)
    await api().post(`/api/team/moderators/${moderator.id}/activate`).set(a)

    const actions = (await prisma.auditEvent.findMany({ orderBy: { createdAt: 'asc' } })).map((e) => e.action)
    expect(actions).toEqual(['product_granted', 'product_revoked', 'user_deactivated', 'user_activated'])
  })
})
