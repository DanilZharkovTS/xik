import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../src/shared/database/prisma.js'
import {
  api,
  auth,
  createProduct,
  createUser,
  login,
  resetDb,
} from './helpers.js'

describe('library license key endpoint', () => {
  beforeEach(async () => {
    await resetDb()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('successfully returns full library item with licenseKey from license service', async () => {
    const user = await createUser('user', 'lib-user@example.com')
    const { accessToken } = await login('lib-user@example.com')
    const product = await createProduct('AI Assistant')

    const subId = 'sub_valid_123'
    const libraryItem = await prisma.userLibrary.create({
      data: {
        userId: user.id,
        productId: product.id,
        subscriptionId: subId,
        stripeSubscriptionId: subId,
        licenseId: 42,
        accessExpiresAt: new Date('2027-01-01'),
      },
    })

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/admin/licenses/42')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 42,
              key: 'XIK-PRO-KEY-9999',
              is_active: true,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })
    vi.stubGlobal('fetch', fetchMock)

    // 1. Test POST /api/library/license-key
    const postRes = await api()
      .post('/api/library/license-key')
      .set(auth(accessToken))
      .send({ subscriptionId: subId })

    expect(postRes.status).toBe(200)
    expect(postRes.body).toMatchObject({
      id: libraryItem.id,
      userId: user.id,
      productId: product.id,
      subscriptionId: subId,
      licenseId: 42,
      licenseKey: 'XIK-PRO-KEY-9999',
    })
    expect(postRes.body.libraryItem).toMatchObject({
      id: libraryItem.id,
      licenseKey: 'XIK-PRO-KEY-9999',
    })

    // 2. Test GET /api/library/license-key/:subscriptionId
    const getRes1 = await api()
      .get(`/api/library/license-key/${subId}`)
      .set(auth(accessToken))
    expect(getRes1.status).toBe(200)
    expect(getRes1.body.licenseKey).toBe('XIK-PRO-KEY-9999')

    // 3. Test GET /api/library/:subscriptionId/license-key
    const getRes2 = await api()
      .get(`/api/library/${subId}/license-key`)
      .set(auth(accessToken))
    expect(getRes2.status).toBe(200)
    expect(getRes2.body.licenseKey).toBe('XIK-PRO-KEY-9999')
  })

  it('returns 404 if library item is not found in database', async () => {
    const user = await createUser('user', 'notfound-user@example.com')
    const { accessToken } = await login('notfound-user@example.com')

    const res = await api()
      .post('/api/library/license-key')
      .set(auth(accessToken))
      .send({ subscriptionId: 'nonexistent_sub_id' })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('LIBRARY_ITEM_NOT_FOUND')
  })

  it('returns 404 if library item has no licenseId', async () => {
    const user = await createUser('user', 'no-lic@example.com')
    const { accessToken } = await login('no-lic@example.com')
    const product = await createProduct('No License Product')

    const subId = 'sub_no_lic_456'
    await prisma.userLibrary.create({
      data: {
        userId: user.id,
        productId: product.id,
        subscriptionId: subId,
        licenseId: null,
      },
    })

    const res = await api()
      .post('/api/library/license-key')
      .set(auth(accessToken))
      .send({ subscriptionId: subId })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('LICENSE_NOT_FOUND')
  })

  it('returns error if license service returns 404 or fails', async () => {
    const user = await createUser('user', 'fail-lic@example.com')
    const { accessToken } = await login('fail-lic@example.com')
    const product = await createProduct('Fail License Product')

    const subId = 'sub_fail_lic_789'
    await prisma.userLibrary.create({
      data: {
        userId: user.id,
        productId: product.id,
        subscriptionId: subId,
        licenseId: 99999,
      },
    })

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'license_not_found', message: 'License key not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await api()
      .post('/api/library/license-key')
      .set(auth(accessToken))
      .send({ subscriptionId: subId })

    expect(res.status).toBe(404)
    expect(res.body.code).toBe('LICENSE_NOT_FOUND')
  })

  it('validates subscriptionId input strictly', async () => {
    const user = await createUser('user', 'val-user@example.com')
    const { accessToken } = await login('val-user@example.com')

    const emptyRes = await api()
      .post('/api/library/license-key')
      .set(auth(accessToken))
      .send({ subscriptionId: '' })

    expect(emptyRes.status).toBe(400)

    const missingRes = await api()
      .post('/api/library/license-key')
      .set(auth(accessToken))
      .send({})

    expect(missingRes.status).toBe(400)
  })
})
