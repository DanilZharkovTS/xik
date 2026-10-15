import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { api, createUser, resetDb, loginOk, auth } from './helpers.js'
import { prisma } from '../src/shared/database/prisma.js'

describe('password reset & change notification flow', () => {
  beforeEach(async () => {
    await resetDb()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('request-password-reset creates action token and calls notification service', async () => {
    const user = await createUser('user', 'reset-user@example.com', 'password-123')

    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'reset-user@example.com' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ passwordResetWasRequested: true })

    const token = await prisma.actionToken.findFirst({
      where: { userId: user.id, type: 'passwordReset' },
    })
    expect(token).not.toBeNull()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/email/password-reset')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body as string)
    expect(body).toMatchObject({
      to: 'reset-user@example.com',
      locale: user.locale,
      userName: user.name,
    })
    expect(typeof body.token).toBe('string')
    expect(body.token.length).toBeGreaterThan(0)
  })

  it('request-password-reset returns 404 for nonexistent email', async () => {
    const res = await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'unknown@example.com' })

    expect(res.status).toBe(404)
  })

  it('request-password-change creates action token and calls notification service for authenticated user', async () => {
    const user = await createUser('user', 'change-user@example.com', 'password-123')
    const session = await loginOk('change-user@example.com', 'password-123')

    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await api()
      .post('/api/auth/request-password-change')
      .set(auth(session.accessToken))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ passwordResetWasRequested: true })

    const token = await prisma.actionToken.findFirst({
      where: { userId: user.id, type: 'passwordReset' },
    })
    expect(token).not.toBeNull()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/email/password-reset')

    const body = JSON.parse(options.body as string)
    expect(body).toMatchObject({
      to: 'change-user@example.com',
      locale: user.locale,
      userName: user.name,
    })
    expect(typeof body.token).toBe('string')
  })

  it('returns 502 NOTIFICATION_FAILED if notification service fails', async () => {
    await createUser('user', 'fail-user@example.com', 'password-123')

    const fetchMock = vi.fn().mockResolvedValue(new Response('Service Unavailable', { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'fail-user@example.com' })

    expect(res.status).toBe(502)
    expect(res.body.code).toBe('NOTIFICATION_FAILED')
  })

  it('reset-password validates matching newPassword and confirmNewPassword', async () => {
    const res = await api()
      .post('/api/auth/reset-password')
      .send({
        token: 'any-token',
        newPassword: 'password-abc-1',
        confirmNewPassword: 'password-abc-2',
      })

    expect(res.status).toBe(400)
    expect(JSON.stringify(res.body)).toContain('Passwords do not match')
  })

  it('reset-password rejects invalid or missing token', async () => {
    const res = await api()
      .post('/api/auth/reset-password')
      .send({
        token: 'nonexistent-token',
        newPassword: 'new-valid-pass-123',
        confirmNewPassword: 'new-valid-pass-123',
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('Token is invalid or expired')
  })

  it('reset-password successfully updates password, consumes token, and allows login with new password', async () => {
    const user = await createUser('user', 'reset-success@example.com', 'old-password-123')

    // Request reset to get raw token
    let rawResetToken = ''
    const fetchMock = vi.fn().mockImplementation((_url, options) => {
      const parsed = JSON.parse(options.body as string)
      if (parsed.token) {
        rawResetToken = parsed.token
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    })
    vi.stubGlobal('fetch', fetchMock)

    await api()
      .post('/api/auth/request-password-reset')
      .send({ email: 'reset-success@example.com' })

    expect(rawResetToken).toBeTruthy()

    // Try same password as current -> should fail 400
    const sameRes = await api()
      .post('/api/auth/reset-password')
      .send({
        token: rawResetToken,
        newPassword: 'old-password-123',
        confirmNewPassword: 'old-password-123',
      })
    expect(sameRes.status).toBe(400)
    expect(sameRes.body.message).toContain('New password must be different from current password')

    // Reset with new password -> should succeed 200
    const successRes = await api()
      .post('/api/auth/reset-password')
      .send({
        token: rawResetToken,
        newPassword: 'brand-new-password-456',
        confirmNewPassword: 'brand-new-password-456',
      })
    expect(successRes.status).toBe(200)
    expect(successRes.body).toEqual({ passwordChanged: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [changedUrl, changedOptions] = fetchMock.mock.calls[1]
    expect(changedUrl).toContain('/api/email/password-changed')
    expect(changedOptions.method).toBe('POST')
    expect(JSON.parse(changedOptions.body as string)).toMatchObject({
      to: 'reset-success@example.com',
      locale: user.locale,
      userName: user.name,
    })

    // Token must now be consumed
    const consumedToken = await prisma.actionToken.findFirst({
      where: { userId: user.id, type: 'passwordReset' },
    })
    expect(consumedToken?.usedAt).not.toBeNull()

    // Using the same token again -> should fail 400
    const reusedRes = await api()
      .post('/api/auth/reset-password')
      .send({
        token: rawResetToken,
        newPassword: 'another-new-password-789',
        confirmNewPassword: 'another-new-password-789',
      })
    expect(reusedRes.status).toBe(400)
    expect(reusedRes.body.message).toContain('Token is invalid or expired')

    // Login with old password fails, new password succeeds
    const oldLogin = await api().post('/api/auth/login').send({
      email: 'reset-success@example.com',
      password: 'old-password-123',
    })
    expect(oldLogin.status).toBe(401)

    const newLogin = await api().post('/api/auth/login').send({
      email: 'reset-success@example.com',
      password: 'brand-new-password-456',
    })
    expect(newLogin.status).toBe(200)
  })

  it('reset-password rejects expired tokens', async () => {
    const user = await createUser('user', 'expired-test@example.com', 'old-password-123')
    const expiredToken = await prisma.actionToken.create({
      data: {
        userId: user.id,
        type: 'passwordReset',
        tokenHash: 'some-expired-hash',
        expiresAt: new Date(Date.now() - 60_000), // expired 1 min ago
      },
    })

    const res = await api()
      .post('/api/auth/reset-password')
      .send({
        token: 'some-expired-raw-token',
        newPassword: 'brand-new-password-456',
        confirmNewPassword: 'brand-new-password-456',
      })

    expect(res.status).toBe(400)
  })

  it('change-password updates password and calls notification service', async () => {
    const user = await createUser('user', 'change-user@example.com', 'current-password-123')
    const { accessToken } = await loginOk('change-user@example.com', 'current-password-123')

    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await api()
      .post('/api/auth/password-change')
      .set(auth(accessToken))
      .send({
        currentPassword: 'current-password-123',
        newPassword: 'new-secure-password-456',
        confirmNewPassword: 'new-secure-password-456',
      })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ passwordChanged: true })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/email/password-changed')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body as string)
    expect(body).toMatchObject({
      to: 'change-user@example.com',
      locale: user.locale,
      userName: user.name,
    })
  })
})
