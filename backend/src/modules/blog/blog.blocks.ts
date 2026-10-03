import { z } from 'zod'
import { parseVideoUrl } from './blog.video.js'

// Посилання в кнопці: https, http або адреса сайту ("/products"); без javascript: та протокол-відносних.
const link = z
  .string()
  .trim()
  .max(500)
  .refine((value) => /^https?:\/\//i.test(value) || (value.startsWith('/') && !value.startsWith('//')), {
    message: 'Link must start with https://, http:// or /',
  })

const id = z.string().trim().min(1).max(40)

const text = z.object({ id, type: z.literal('text'), text: z.string().trim().min(1).max(6000) }).strict()

const heading = z
  .object({
    id,
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().trim().min(1).max(160),
  })
  .strict()

const image = z
  .object({
    id,
    type: z.literal('image'),
    assetId: z.uuid(),
    alt: z.string().trim().min(1).max(200),
    caption: z.string().trim().max(200).optional(),
  })
  .strict()

const video = z
  .object({
    id,
    type: z.literal('video'),
    url: z
      .string()
      .trim()
      .max(500)
      .refine((value) => parseVideoUrl(value) !== null, {
        message: 'Unsupported video link (YouTube, Vimeo, TikTok, Facebook or X, https only)',
      }),
    caption: z.string().trim().max(200).optional(),
  })
  .strict()

const quote = z
  .object({
    id,
    type: z.literal('quote'),
    text: z.string().trim().min(1).max(600),
    author: z.string().trim().max(100).optional(),
  })
  .strict()

const cta = z
  .object({
    id,
    type: z.literal('cta'),
    title: z.string().trim().min(1).max(120),
    text: z.string().trim().max(300).optional(),
    buttonLabel: z.string().trim().min(1).max(40),
    url: link,
  })
  .strict()

const product = z.object({ id, type: z.literal('product'), productId: z.uuid() }).strict()

// Код показується як є (екранується при відображенні); мова потрібна лише для підсвічування.
const code = z
  .object({
    id,
    type: z.literal('code'),
    language: z
      .string()
      .trim()
      .max(20)
      .regex(/^[a-z0-9+#-]*$/i, 'Language may contain letters, digits, + # -')
      .optional(),
    code: z.string().min(1).max(8000),
  })
  .strict()

const callout = z
  .object({
    id,
    type: z.literal('callout'),
    tone: z.enum(['info', 'tip', 'warning']),
    title: z.string().trim().max(80).optional(),
    text: z.string().trim().min(1).max(1000),
  })
  .strict()

export const blockSchema = z.discriminatedUnion('type', [text, heading, image, video, quote, cta, product, code, callout])

export const blocksSchema = z.array(blockSchema).max(200)

export type Block = z.infer<typeof blockSchema>

export const collectAssetIds = (blocks: Block[]): string[] => [
  ...new Set(blocks.flatMap((block) => (block.type === 'image' ? [block.assetId] : []))),
]

export const collectProductIds = (blocks: Block[]): string[] => [
  ...new Set(blocks.flatMap((block) => (block.type === 'product' ? [block.productId] : []))),
]

// Розмітка тексту (**жирний**, *курсив*, [текст](посилання)) не рахується словами.
const plain = (value: string): string =>
  value.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`>#-]/g, ' ')

const WORDS_PER_MINUTE = 200

export const readingMinutes = (blocks: Block[]): number => {
  const words = blocks
    .flatMap((block) => {
      switch (block.type) {
        case 'text':
        case 'heading':
        case 'quote':
          return [block.text]
        case 'cta':
          return [block.title, block.text ?? '']
        case 'callout':
          return [block.text]
        default:
          return []
      }
    })
    .map(plain)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length

  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
