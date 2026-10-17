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

const publication = (productId: string, userId: string, at: Date, n: number) =>
  prisma.outreachEvent.create({
    data: {
      productId,
      userId,
      type: 'publication',
      channel: 'telegram',
      publicationKind: 'post',
      url: `https://x.com/p/${n}`,
      urlNormalized: `x.com/p/${n}`,
      occurredAt: at,
    },
  })

describe('адмін: список користувачів', () => {
  beforeEach(resetDb)

  it('шукає за імʼям або e-mail і фільтрує за роллю', async () => {
    await createUser('admin', 'boss@test.io')
    await createUser('moderator', 'anna@test.io')
    await createUser('user', 'client@shop.io')
    const { accessToken } = await loginOk('boss@test.io')

    const byEmail = await api()
      .get('/api/users')
      .query({ q: 'shop.io' })
      .set(auth(accessToken))
    expect(byEmail.status).toBe(200)
    expect(byEmail.body.users.map((u: { email: string }) => u.email)).toEqual([
      'client@shop.io',
    ])

    const byName = await api()
      .get('/api/users')
      .query({ q: 'ANNA' })
      .set(auth(accessToken))
    expect(byName.body.users.map((u: { email: string }) => u.email)).toEqual([
      'anna@test.io',
    ])

    const moderators = await api()
      .get('/api/users')
      .query({ role: 'moderator' })
      .set(auth(accessToken))
    expect(
      moderators.body.users.every(
        (u: { role: string }) => u.role === 'moderator'
      )
    ).toBe(true)
    expect(moderators.body.users).toHaveLength(1)

    const legacy = await api()
      .get('/api/users')
      .query({ name: 'anna' })
      .set(auth(accessToken))
    expect(legacy.body.users).toHaveLength(1)

    expect(
      (
        await api()
          .get('/api/users')
          .query({ role: 'root' })
          .set(auth(accessToken))
      ).status
    ).toBe(400)
  })

  it('сторінки по 50 з ознакою hasMore і курсором', async () => {
    await createUser('admin', 'boss@test.io')
    await prisma.user.createMany({
      data: Array.from({ length: 55 }, (_, i) => ({
        email: `bulk${i}@test.io`,
        name: `Bulk ${i}`,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)),
      })),
    })
    const { accessToken } = await loginOk('boss@test.io')

    const first = await api().get('/api/users').set(auth(accessToken))
    expect(first.body.users).toHaveLength(50)
    expect(first.body.hasMore).toBe(true)

    const second = await api()
      .get('/api/users')
      .query({
        lastId: first.body.lastId,
        lastCreatedAt: first.body.lastCreatedAt,
      })
      .set(auth(accessToken))
    expect(second.body.users).toHaveLength(6)
    expect(second.body.hasMore).toBe(false)

    const ids = new Set(
      [...first.body.users, ...second.body.users].map(
        (u: { id: string }) => u.id
      )
    )
    expect(ids.size).toBe(56)
  })
})

describe('адмін: активність модераторів', () => {
  beforeEach(resetDb)

  it('рахує події за 7 днів, останню подію й останній вхід', async () => {
    await createUser('admin', 'boss@test.io')
    const busy = await createUser('moderator', 'busy@test.io')
    const idle = await createUser('moderator', 'idle@test.io')
    const product = await createProduct()
    const now = Date.now()

    await publication(product.id, busy.id, new Date(now - 60 * 60 * 1000), 1)
    await publication(
      product.id,
      busy.id,
      new Date(now - 2 * 24 * 60 * 60 * 1000),
      2
    )
    await publication(
      product.id,
      busy.id,
      new Date(now - 10 * 24 * 60 * 60 * 1000),
      3
    )
    await loginOk('busy@test.io')

    const { accessToken } = await loginOk('boss@test.io')
    const res = await api().get('/api/team/moderators').set(auth(accessToken))
    expect(res.status).toBe(200)

    const byEmail = Object.fromEntries(
      res.body.moderators.map((m: { email: string; activity: unknown }) => [
        m.email,
        m.activity,
      ])
    )
    expect(byEmail['busy@test.io'].weekEvents).toBe(2)
    expect(
      new Date(byEmail['busy@test.io'].lastEventAt).getTime()
    ).toBeGreaterThan(now - 2 * 60 * 60 * 1000)
    expect(byEmail['busy@test.io'].lastSignInAt).not.toBeNull()

    expect(byEmail['idle@test.io']).toEqual({
      weekEvents: 0,
      lastEventAt: null,
      lastSignInAt: null,
    })
    expect(idle.id).toBeTruthy()
  })
})
