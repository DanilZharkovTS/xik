import z from "zod"
import { PRODUCT_BILLING_PERIODS, PRODUCT_CATEGORIES, PRODUCT_CURRENCIES } from "./data/products"

export const createProductSchema = z.object({
  slug: z.string().min(1).max(50, 'Product slug is too long'),
  name: z.string().min(1).max(50, 'Product name is too long'),
  shortDescription: z
    .string()
    .min(1, 'Product short description is required')
    .max(160, 'Product short description is too long'),
  description: z
    .string()
    .min(1, 'Product description is required')
    .max(2000, 'Product description is too long'),
  categories: z
    .array(
      z.enum(PRODUCT_CATEGORIES),
      'Product must have at least one category'
    )
    .min(1),
  features: z
    .array(z.string().max(50), 'Product must have at least one feature')
    .min(1),
  price: z.number().positive(),
  currency: z.enum(PRODUCT_CURRENCIES, 'Currency missing or invalid'),
  billingPeriod: z.enum(
    PRODUCT_BILLING_PERIODS,
    'Billing period missing or invalid'
  ),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductDto = z.infer<typeof createProductSchema>
export type UpdateProductDto = z.infer<typeof updateProductSchema>
