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
})
