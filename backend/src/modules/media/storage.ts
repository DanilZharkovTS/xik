import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { ApiError } from '../../shared/utils/ApiError.js'

// Сховище будь-яке S3-сумісне: AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces.
// Налаштування лише через змінні середовища; без них завантаження зображень вимкнене (503).
//   S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY      обовʼязкові
//   S3_ENDPOINT        для не-AWS (наприклад http://minio:9000), тоді адреси в стилі path
//   S3_REGION          за замовчуванням "auto" (підходить R2 і MinIO) або us-east-1
//   S3_PUBLIC_URL      публічна адреса файлів (CDN або bucket), без неї береться endpoint/bucket
export interface Storage {
  put: (key: string, body: Buffer, contentType: string) => Promise<string>
}

let client: S3Client | null = null

export const isStorageConfigured = (): boolean =>
  Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)

const publicUrlFor = (key: string): string => {
  const bucket = process.env.S3_BUCKET!
  const base =
    process.env.S3_PUBLIC_URL ??
    (process.env.S3_ENDPOINT
      ? `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${bucket}`
      : `https://${bucket}.s3.${process.env.S3_REGION ?? 'us-east-1'}.amazonaws.com`)

  return `${base.replace(/\/$/, '')}/${key}`
}

export const storage: Storage = {
  put: async (key, body, contentType) => {
    if (!isStorageConfigured()) {
      throw ApiError(503, 'STORAGE_NOT_CONFIGURED', 'Image storage is not configured')
    }

    client ??= new S3Client({
      region: process.env.S3_REGION ?? (process.env.S3_ENDPOINT ? 'auto' : 'us-east-1'),
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    })

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Ім'я файлу містить випадковий id і не змінюється, тож кешувати можна надовго.
        CacheControl: 'public, max-age=31536000, immutable',
      })
    )

    return publicUrlFor(key)
  },
}
