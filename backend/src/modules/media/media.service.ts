import { randomUUID } from 'node:crypto'
import { imageSize } from 'image-size'
import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { storage } from './storage.js'

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_DIMENSION = 8000

// Тип файлу визначаємо за вмістом, а не за заголовком запиту: його можна підробити.
const TYPES = {
  jpg: { mime: 'image/jpeg', ext: 'jpg' },
  png: { mime: 'image/png', ext: 'png' },
  webp: { mime: 'image/webp', ext: 'webp' },
  gif: { mime: 'image/gif', ext: 'gif' },
} as const

export const ACCEPTED_MIME = Object.values(TYPES).map((type) => type.mime)

export const mediaService = {
  upload: async (user: TokenPayload, body: unknown) => {
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send a JPEG, PNG, WebP or GIF image as the request body')
    }

    if (body.length > MAX_IMAGE_BYTES) {
      throw ApiError(413, 'IMAGE_TOO_LARGE', 'Image is larger than 8 MB')
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

    const now = new Date()
    const key = `articles/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${type.ext}`
    const url = await storage.put(key, body, type.mime)

    const asset = await prisma.mediaAsset.create({
      data: {
        key,
        url,
        mime: type.mime,
        size: body.length,
        width: info.width,
        height: info.height,
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
  mime: string
  size: number
  width: number
  height: number
  createdAt: Date
}) => ({
  id: asset.id,
  url: asset.url,
  mime: asset.mime,
  size: asset.size,
  width: asset.width,
  height: asset.height,
  createdAt: asset.createdAt,
})
