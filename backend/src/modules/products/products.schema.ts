import z from 'zod'
import {
  PRODUCT_BILLING_PERIODS,
  PRODUCT_CATEGORIES,
  PRODUCT_CURRENCIES,
  PRODUCT_KINDS,
  PRODUCT_STATUSES,
  CONTENT_LOCALES,
} from './product.constants.js'

export const findProductsSchema = z.object({
  name: z.string().optional(),
  kind: z.enum(PRODUCT_KINDS).optional(),
  lastId: z.string().optional(),
  lastCreatedAt: z.coerce.date().optional(),
})

export const catalogQuerySchema = z.object({
  kind: z.enum(PRODUCT_KINDS).optional(),
  lang: z.enum(CONTENT_LOCALES).default('en'),
})

export const langQuerySchema = z.object({
  lang: z.enum(CONTENT_LOCALES).default('en'),
})

export const adminListSchema = z.object({
  q: z.string().trim().max(100).optional(),
  kind: z.enum(PRODUCT_KINDS).optional(),
  state: z.enum(['active', 'archived']).default('active'),
})

const httpUrl = z.url({ protocol: /^https?$/ }).max(2048)

const capability = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(400),
})

const architecture = z.object({
  stack: z.array(z.string().trim().min(1).max(40)).max(12),
  runtime: z.string().trim().max(120),
  deployment: z.string().trim().max(120),
  latency: z.string().trim().max(60),
})

// Переклад не обовʼязковий і може бути частковим: що не заповнено, на сайті показується англійською.
const translation = z
  .object({
    name: z.string().trim().max(60).optional(),
    shortDescription: z.string().trim().max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    tagline: z.string().trim().max(200).optional(),
    categoryLabel: z.string().trim().max(80).optional(),
    features: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
    highlights: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
    capabilities: z.array(capability).max(12).optional(),
    architecture: z
      .object({
        runtime: z.string().trim().max(120).optional(),
        deployment: z.string().trim().max(120).optional(),
        latency: z.string().trim().max(60).optional(),
      })
      .optional(),
  })
  .strict()

export const translationsSchema = z
  .object({
    es: translation.optional(),
    uk: translation.optional(),
  })
  .strict()

export const createProductSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50, 'Product slug is too long')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug may contain only lowercase letters, digits and single hyphens'
    ),
  name: z.string().trim().min(1).max(60, 'Product name is too long'),
  kind: z.enum(PRODUCT_KINDS).default('product'),
  status: z.enum(PRODUCT_STATUSES).default('active'),
  shortDescription: z
    .string()
    .trim()
    .min(1, 'Product short description is required')
    .max(160, 'Product short description is too long'),
  description: z
    .string()
    .trim()
    .min(1, 'Product description is required')
    .max(2000, 'Product description is too long'),
  categories: z
    .array(
      z.enum(PRODUCT_CATEGORIES),
      'Product must have at least one category'
    )
    .min(1, 'Product must have at least one category'),
  features: z
    .array(z.string().trim().min(1).max(120))
    .min(1, 'Product must have at least one feature')
    .max(20),
  categoryLabel: z.string().trim().max(80).nullable().optional(),
  tagline: z.string().trim().max(200).nullable().optional(),
  highlights: z.array(z.string().trim().min(1).max(80)).max(8).default([]),
  capabilities: z.array(capability).max(12).default([]),
  architecture: architecture.nullable().optional(),
  protocols: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  demoUrl: httpUrl.nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  // Ціна є завжди: вона створює ціну у Stripe. showPrice лише ховає її на сторінці продукту.
  price: z.number().positive().max(1_000_000),
  currency: z.enum(PRODUCT_CURRENCIES, 'Currency missing or invalid'),
  billingPeriod: z.enum(
    PRODUCT_BILLING_PERIODS,
    'Billing period missing or invalid'
  ),
  showPrice: z.boolean().default(true),
  translations: translationsSchema.default({}),
})

// Часткове оновлення: значення за замовчуванням тут не застосовуються.
export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    // partial() зберігає .default(), тому без цього відсутнє поле перезаписало б існуюче.
    kind: z.enum(PRODUCT_KINDS).optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    highlights: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
    capabilities: z.array(capability).max(12).optional(),
    protocols: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    showPrice: z.boolean().optional(),
    translations: translationsSchema.optional(),
  })

//dto

export type FindProductsDto = z.infer<typeof findProductsSchema>
export type LangQueryDto = z.infer<typeof langQuerySchema>
export type ProductTranslationsDto = z.infer<typeof translationsSchema>
export type CatalogQueryDto = z.infer<typeof catalogQuerySchema>
export type AdminListDto = z.infer<typeof adminListSchema>
export type CreateProductDto = z.infer<typeof createProductSchema>
export type UpdateProductDto = z.infer<typeof updateProductSchema>
