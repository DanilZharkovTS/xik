import { randomUUID } from 'node:crypto'
import { imageSize } from 'image-size'
import sharp from 'sharp'
import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { storage, publicAssetUrl } from './storage.js'

// Завантажити можна до 25 МБ: завеликі зображення стискаються автоматично.
// Після стиснення файл не має перевищувати 8 МБ (так буває лише з GIF, його не чіпаємо: він може бути анімований).
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
const MAX_STORED_BYTES = 8 * 1024 * 1024
const MAX_DIMENSION = 8000
// Для сторінок блогу більше не потрібно; більші зображення зменшуються до цієї довшої сторони.
const MAX_SIDE = 2400
const MAX_PIXELS = 64_000_000

// Тип файлу визначаємо за вмістом, а не за заголовком запиту: його можна підробити.
const TYPES = {
  jpg: { mime: 'image/jpeg', ext: 'jpg' },
  png: { mime: 'image/png', ext: 'png' },
  webp: { mime: 'image/webp', ext: 'webp' },
  gif: { mime: 'image/gif', ext: 'gif' },
} as const

export const ACCEPTED_MIME = Object.values(TYPES).map((type) => type.mime)

interface Processed {
  body: Buffer
  width: number
  height: number
}

// Зменшує до MAX_SIDE, застосовує поворот з EXIF і перекодовує (метадані, зокрема геолокація, відкидаються).
// Якщо результат не менший і зображення не зменшувалось, лишається оригінал.
export const optimizeImage = async (
  input: Buffer,
  ext: (typeof TYPES)[keyof typeof TYPES]['ext'],
  size: { width: number; height: number }
): Promise<Processed> => {
  if (ext === 'gif') return { body: input, ...size }

  try {
    const pipeline = sharp(input, { limitInputPixels: MAX_PIXELS })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })

    const encoded =
      ext === 'jpg'
        ? pipeline.jpeg({ quality: 82, mozjpeg: true })
        : ext === 'png'
          ? pipeline.png({ compressionLevel: 9 })
          : pipeline.webp({ quality: 82 })

    const { data, info } = await encoded.toBuffer({ resolveWithObject: true })
    const wasResized = Math.max(size.width, size.height) > MAX_SIDE

    if (data.length >= input.length && !wasResized) return { body: input, ...size }

    return { body: data, width: info.width, height: info.height }
  } catch {
    throw ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'The image could not be processed')
  }
}

export const mediaService = {
  upload: async (user: TokenPayload, body: unknown) => {
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send a JPEG, PNG, WebP or GIF image as the request body')
    }

    if (body.length > MAX_UPLOAD_BYTES) {
      throw ApiError(413, 'IMAGE_TOO_LARGE', 'Image is larger than 25 MB')
    }

    let info: ReturnType<typeof imageSize>

    try {
      info = imageSize(body)
    } catch {
      throw ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'The file is not a valid image')
    }

    const type = TYPES[info.type as keyof typeof TYPES]

    if (!type || !info.width || !info.height) {
      throw ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Only JPEG, PNG, WebP and GIF are allowed')
    }

    if (info.width > MAX_DIMENSION || info.height > MAX_DIMENSION) {
      throw ApiError(413, 'IMAGE_TOO_LARGE', `Image is larger than ${MAX_DIMENSION}px`)
    }

    const processed = await optimizeImage(body, type.ext, { width: info.width, height: info.height })

    if (processed.body.length > MAX_STORED_BYTES) {
      throw ApiError(413, 'IMAGE_TOO_LARGE', 'Image is larger than 8 MB even after compression')
    }

    const now = new Date()
    const key = `articles/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${type.ext}`
    const url = await storage.put(key, processed.body, type.mime)

    const asset = await prisma.mediaAsset.create({
      data: {
        key,
        url,
        mime: type.mime,
        size: processed.body.length,
        width: processed.width,
        height: processed.height,
        createdById: user.id,
      },
    })

    return { response: { asset: toAssetDto(asset) } }
  },

  list: async (page: number) => {
    const take = 24
    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * take,
        take,
      }),
      prisma.mediaAsset.count(),
    ])

    return { response: { assets: items.map(toAssetDto), total, pages: Math.max(1, Math.ceil(total / take)) } }
  },
}

export const toAssetDto = (asset: {
  id: string
  url: string
  key?: string
  mime: string
  size: number
  width: number
  height: number
  createdAt: Date
}) => ({
  id: asset.id,
  url: publicAssetUrl(asset),
  mime: asset.mime,
  size: asset.size,
  width: asset.width,
  height: asset.height,
  createdAt: asset.createdAt,
})
