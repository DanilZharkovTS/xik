import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ApiError } from '../../shared/utils/ApiError.js'

// Зображення зберігаються на сервері, у папці на диску; їх віддає сам бекенд за адресою /media.
//   MEDIA_DIR  папка з файлами (за замовчуванням ./media; у Docker це змонтований том)
//   MEDIA_URL  публічна адреса цієї папки у браузері, без "/" в кінці
//              (за замовчуванням http://localhost:<PORT>/media; у продакшні вкажіть домен API)
export interface Storage {
  put: (key: string, body: Buffer, contentType: string) => Promise<string>
}

export const mediaDir = (): string =>
  path.resolve(process.env.MEDIA_DIR ?? 'media')

const mediaUrl = (): string =>
  (
    process.env.MEDIA_URL ??
    `http://localhost:${process.env.PORT ?? 5001}/media`
  ).replace(/\/$/, '')

// Resolve existing local assets against the current public domain as well as new uploads.
export const publicAssetUrl = (asset: { key?: string; url: string }): string =>
  process.env.MEDIA_URL && asset.key ? `${mediaUrl()}/${asset.key}` : asset.url

export const storage: Storage = {
  put: async (key, body) => {
    const root = mediaDir()
    const file = path.resolve(root, key)

    // Ключ будуємо ми самі, та шлях усе одно має лишатися всередині папки.
    if (!file.startsWith(root + path.sep)) {
      throw ApiError(400, 'INVALID_KEY', 'Invalid file key')
    }

    try {
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, body)
    } catch (err) {
      console.error(
        'Media write failed:',
        err instanceof Error ? err.message : err
      )
      throw ApiError(
        502,
        'STORAGE_UNAVAILABLE',
        'Could not save the image on the server. Check MEDIA_DIR and its permissions.'
      )
    }

    return `${mediaUrl()}/${key}`
  },
}
