import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api, auth, createUser, loginOk, resetDb } from './helpers.js'
import { prisma } from '../src/shared/database/prisma.js'
import { tokenService } from '../src/shared/services/token.service.js'

const okFetch = () =>
  vi
    .fn()
    .mockImplementation(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 })
    )

const refreshCookie = (cookies: string[] | undefined) =>
  (cookies ?? []).find((c) => c.startsWith('refreshToken='))!.split(';')[0]

const tokenFrom = (fetchMock: ReturnType<typeof okFetch>, call: number) =>
  JSON.parse(fetchMock.mock.calls[call][1].body as string).token as string

describe('зміна пароля закриває інші сесії', () => {
  beforeEach(async () => {
    await resetDb()
    vi.stubGlobal('fetch', okFetch())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('інші сесії відкликано, поточна працює', async () => {
    await createUser('user', 'sessions@test.io', 'old-password-123')
    const attacker = await loginOk('sessions@test.io', 'old-password-123')
    const owner = await loginOk('sessions@test.io', 'old-password-123')

    const res = await api()
      .post('/api/auth/password-change')
      .set(auth(owner.accessToken))
      .send({
        currentPassword: 'old-password-123',
        newPassword: 'new-password-456',
      })
    expect(res.status).toBe(200)

    // Чужий access-токен більше не приймається, а refresh не продовжує сесію.
    expect(
      (await api().get('/api/account').set(auth(attacker.accessToken))).status
    ).toBe(401)
    const attackerRefresh = await api()
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie(attacker.cookies))
    expect(attackerRefresh.status).toBe(401)

    // Поточна сесія лишається робочою, включно з refresh.
    expect(
      (await api().get('/api/account').set(auth(owner.accessToken))).status
    ).toBe(200)
    const ownerRefresh = await api()
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie(owner.cookies))
    expect(ownerRefresh.status).toBe(200)
  })

  it('після зміни пароля старе посилання на скидання не діє', async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)
    await createUser('user', 'stale-link@test.io', 'old-password-123')
    const session = await loginOk('stale-link@test.io', 'old-password-123')

    await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'stale-link@test.io' })
    const staleToken = tokenFrom(fetchMock, 0)

    await api()
      .post('/api/auth/password-change')
      .set(auth(session.accessToken))
      .send({
        currentPassword: 'old-password-123',
        newPassword: 'new-password-456',
      })

    const res = await api().post('/api/auth/reset-password').send({
      token: staleToken,
      newPassword: 'third-password-789',
      confirmNewPassword: 'third-password-789',
    })
    expect(res.status).toBe(400)
  })
})

describe('токени скидання пароля', () => {
  beforeEach(async () => {
    await resetDb()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('новий запит гасить попередні посилання', async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)
    const user = await createUser(
      'user',
      'one-link@test.io',
      'old-password-123'
    )

    await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'one-link@test.io' })
    await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'one-link@test.io' })
    const [first, second] = [tokenFrom(fetchMock, 0), tokenFrom(fetchMock, 1)]

    const active = await prisma.actionToken.findMany({
      where: { userId: user.id, type: 'passwordReset', usedAt: null },
    })
    expect(active).toHaveLength(1)
    expect(active[0].tokenHash).toBe(tokenService.hash(second))

    const withFirst = await api().post('/api/auth/reset-password').send({
      token: first,
      newPassword: 'new-password-456',
      confirmNewPassword: 'new-password-456',
    })
    expect(withFirst.status).toBe(400)

    const withSecond = await api().post('/api/auth/reset-password').send({
      token: second,
      newPassword: 'new-password-456',
      confirmNewPassword: 'new-password-456',
    })
    expect(withSecond.status).toBe(200)
  })
})

describe('ліміти на листи', () => {
  beforeEach(async () => {
    await resetDb()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('скидання пароля: не більше 3 листів на адресу, регістр не допомагає', async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)
    await createUser('user', 'bomb@test.io')

    for (const email of ['bomb@test.io', 'BOMB@test.io', 'Bomb@Test.io']) {
      const res = await api()
        .post('/api/auth/request-password-reset')
        .send({ email })
      expect(res.status).not.toBe(429)
    }

    const blocked = await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'bomb@test.io' })
    expect(blocked.status).toBe(429)
    expect(blocked.body.code).toBe('RATE_LIMITED')
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(3)

    // Інша адреса не страждає.
    await createUser('user', 'neighbour@test.io')
    const other = await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'neighbour@test.io' })
    expect(other.status).toBe(200)
  })

  it('лист для зміни пароля з кабінету: не більше 3 на користувача', async () => {
    vi.stubGlobal('fetch', okFetch())
    await createUser('user', 'cabinet@test.io')
    const session = await loginOk('cabinet@test.io')

    for (let i = 0; i < 3; i++) {
      const res = await api()
        .post('/api/auth/request-password-change')
        .set(auth(session.accessToken))
      expect(res.status).toBe(200)
    }

    const blocked = await api()
      .post('/api/auth/request-password-change')
      .set(auth(session.accessToken))
    expect(blocked.status).toBe(429)
  })

  it('без токена лімітер кабінету не спрацьовує раніше за авторизацію', async () => {
    const res = await api().post('/api/auth/request-password-change')
    expect(res.status).toBe(401)
  })
})
