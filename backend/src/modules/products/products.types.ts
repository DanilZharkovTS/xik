import { Prisma } from "../../generated/prisma/client.js"

export type ProductCategory =
  | 'development'
  | 'writing'
  | 'design'
  | 'productivity'
  | 'education'
  | 'business'
  | 'marketing'
  | 'finance'
  | 'research'
  | 'analytics'
  | 'communication'
  | 'automation'
  | 'imageGeneration'
  | 'videoGeneration'
  | 'audio'
  | 'translation'
  | 'socialMedia'
  | 'sales'
  | 'legal'
  | 'cybersecurity'
  | 'dataScience'
  | 'lifestyle'

export type ProductCurrency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CHF'
  | 'CNY'
  | 'UAH'

export type ProductBillingPeriod = 'week' | 'month' | 'year'

export interface Product {
  id: string

  stripeProductId: string
  stripePriceId: string

  slug: string
  name: string
  shortDescription: string
  description: string
  categories: ProductCategory[]
  features: string[]

  price: Prisma.Decimal
  currency: ProductCurrency
  billingPeriod: ProductBillingPeriod

  updatedAt: Date
  createdAt: Date
}
