import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { storage, publicAssetUrl } from '../src/modules/media/storage.js'

let dir = ''

afterEach(async () => {
  vi.unstubAllEnvs()
  if (dir) await rm(dir, { recursive: true, force: true })
})

const useTempDir = async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'xik-media-'))
  vi.stubEnv('MEDIA_DIR', dir)
}

describe('сховище зображень на диску', () => {
  it('existing assets use the configured public domain instead of a stored localhost URL', () => {
    vi.stubEnv('MEDIA_URL', 'https://api.example.com/media/')
    expect(publicAssetUrl({ key: 'articles/a.png', url: 'http://localhost:5001/media/articles/a.png' })).toBe('https://api.example.com/media/articles/a.png')
  })
  it('пише файл у папку й повертає публічну адресу', async () => {
    await useTempDir()
    vi.stubEnv('MEDIA_URL', 'https://api.example.com/media/')

    const url = await storage.put('articles/2026/10/a.png', Buffer.from('png-bytes'), 'image/png')

    expect(url).toBe('https://api.example.com/media/articles/2026/10/a.png')
    expect((await readFile(path.join(dir, 'articles/2026/10/a.png'))).toString()).toBe('png-bytes')
  })

  it('адреса за замовчуванням вказує на бекенд', async () => {
    await useTempDir()
    vi.stubEnv('MEDIA_URL', '')
    vi.stubEnv('PORT', '5001')
    delete process.env.MEDIA_URL

    expect(await storage.put('a.png', Buffer.from('x'), 'image/png')).toBe('http://localhost:5001/media/a.png')
  })

  it('не виходить за межі папки', async () => {
    await useTempDir()

    await expect(storage.put('../escape.png', Buffer.from('x'), 'image/png')).rejects.toMatchObject({ status: 400 })
  })

  it('недоступна папка дає 502, а не 500', async () => {
    // Папка не може бути створена всередині звичайного файлу.
    dir = await mkdtemp(path.join(os.tmpdir(), 'xik-media-'))
    await writeFile(path.join(dir, 'blocker'), 'x')
    vi.stubEnv('MEDIA_DIR', path.join(dir, 'blocker', 'media'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(storage.put('a.png', Buffer.from('x'), 'image/png')).rejects.toMatchObject({
      status: 502,
      code: 'STORAGE_UNAVAILABLE',
    })
  })
})
