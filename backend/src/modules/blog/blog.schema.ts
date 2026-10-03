import { z } from 'zod'
import { blocksSchema } from './blog.blocks.js'

const LOCALES = ['en', 'es', 'uk'] as const

const slug = z
  .string()
  .trim()
  .min(1)
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain lowercase latin letters, digits and hyphens')

const taxonomySlug = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain lowercase latin letters, digits and hyphens')

export const translationInputSchema = z
  .object({
    slug,
    title: z.string().trim().min(1).max(120),
    excerpt: z.string().trim().min(1).max(300),
    seoTitle: z.string().trim().max(70).nullable().optional(),
    seoDescription: z.string().trim().max(170).nullable().optional(),
    keywords: z.array(z.string().trim().min(2).max(40)).max(12).default([]),
    coverAlt: z.string().trim().max(200).nullable().optional(),
    blocks: blocksSchema.default([]),
  })
  .strict()

export type TranslationInput = z.infer<typeof translationInputSchema>

export const createArticleSchema = z
  .object({
    status: z.enum(['draft', 'published']).default('draft'),
    // Майбутня дата означає планування: стаття зʼявиться сама.
    publishedAt: z.coerce.date().nullable().optional(),
    coverAssetId: z.uuid().nullable().optional(),
    categoryId: z.uuid().nullable().optional(),
    tagIds: z.array(z.uuid()).max(10).default([]),
    translations: z
      .object({
        en: translationInputSchema,
        es: translationInputSchema.optional(),
        uk: translationInputSchema.optional(),
      })
      .strict(),
  })
  .strict()

export const updateArticleSchema = z
  .object({
    status: z.enum(['draft', 'published', 'archived']).optional(),
    publishedAt: z.coerce.date().nullable().optional(),
    coverAssetId: z.uuid().nullable().optional(),
    categoryId: z.uuid().nullable().optional(),
    tagIds: z.array(z.uuid()).max(10).optional(),
    // null видаляє переклад; англійський видаляти не можна.
    translations: z
      .object({
        en: translationInputSchema.optional(),
        es: translationInputSchema.nullable().optional(),
        uk: translationInputSchema.nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()

export type CreateArticleDto = z.infer<typeof createArticleSchema>
export type UpdateArticleDto = z.infer<typeof updateArticleSchema>

const names = z
  .object({
    en: z.string().trim().min(1).max(50),
    es: z.string().trim().max(50).optional(),
    uk: z.string().trim().max(50).optional(),
  })
  .strict()

export const taxonomySchema = z.object({ slug: taxonomySlug, names }).strict()
export const taxonomyUpdateSchema = z
  .object({ slug: taxonomySlug.optional(), names: names.optional() })
  .strict()
  .refine((data) => data.slug !== undefined || data.names !== undefined, { message: 'Nothing to update' })

export type TaxonomyDto = z.infer<typeof taxonomySchema>
export type TaxonomyUpdateDto = z.infer<typeof taxonomyUpdateSchema>

export const publicListSchema = z.object({
  lang: z.enum(LOCALES).default('en'),
  tag: z.string().trim().max(60).optional(),
  category: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

export const publicLangSchema = z.object({ lang: z.enum(LOCALES).default('en') })

export const adminListSchema = z.object({
  state: z.enum(['draft', 'published', 'scheduled', 'archived', 'all']).default('all'),
  q: z.string().trim().max(100).optional(),
})

export type PublicListDto = z.infer<typeof publicListSchema>
export type AdminListDto = z.infer<typeof adminListSchema>
