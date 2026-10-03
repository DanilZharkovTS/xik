import { Prisma } from '../../generated/prisma/client.js'

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

export type ProductKind = 'product' | 'agent'

export type ProductStatus = 'production' | 'active' | 'beta' | 'build'

export interface ProductCapability {
  title: string
  description: string
}

export interface ProductArchitecture {
  stack: string[]
  runtime: string
  deployment: string
  latency: string
}

export interface Product {
  id: string

  stripeProductId: string | null
  stripePriceId: string | null

  slug: string
  name: string
  shortDescription: string
  description: string
  categories: ProductCategory[]
  features: string[]

  kind: ProductKind
  status: ProductStatus
  categoryLabel: string | null
  tagline: string | null
  highlights: string[]
  capabilities: Prisma.JsonValue
  architecture: Prisma.JsonValue | null
  protocols: string[]
  demoUrl: string | null
  sortOrder: number
  translations: Prisma.JsonValue

  price: Prisma.Decimal
  currency: ProductCurrency
  billingPeriod: ProductBillingPeriod
  showPrice: boolean

  archivedAt: Date | null
  updatedAt: Date
  createdAt: Date
}
