import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllEnvs())

describe('сховище зображень', () => {
  it('без налаштувань: 503 STORAGE_NOT_CONFIGURED', async () => {
    vi.stubEnv('S3_BUCKET', '')
    const { storage } = await import('../src/modules/media/storage.js')

    await expect(storage.put('a.png', Buffer.from('x'), 'image/png')).rejects.toMatchObject({
      status: 503,
      code: 'STORAGE_NOT_CONFIGURED',
    })
  })

  it('недоступне сховище: 502 STORAGE_UNAVAILABLE, а не 500', async () => {
    vi.stubEnv('S3_BUCKET', 'b')
    vi.stubEnv('S3_ACCESS_KEY_ID', 'a')
    vi.stubEnv('S3_SECRET_ACCESS_KEY', 'b')
    vi.stubEnv('S3_ENDPOINT', 'http://127.0.0.1:1')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { storage } = await import('../src/modules/media/storage.js')

    await expect(storage.put('a.png', Buffer.from('x'), 'image/png')).rejects.toMatchObject({
      status: 502,
      code: 'STORAGE_UNAVAILABLE',
    })
  })
})
