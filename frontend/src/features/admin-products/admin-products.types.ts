export type ProductKind = 'product' | 'agent'
export type ProductStatus = 'production' | 'active' | 'beta' | 'build'
export type BillingPeriod = 'week' | 'month' | 'year'

export const CATEGORIES = [
  'development', 'writing', 'design', 'productivity', 'education', 'business',
  'marketing', 'finance', 'research', 'analytics', 'communication', 'automation',
  'imageGeneration', 'videoGeneration', 'audio', 'translation', 'socialMedia',
  'sales', 'legal', 'cybersecurity', 'dataScience', 'lifestyle',
] as const
export type Category = (typeof CATEGORIES)[number]

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'UAH'] as const
export type Currency = (typeof CURRENCIES)[number]

export interface Capability {
  title: string
  description: string
}

export interface Architecture {
  stack: string[]
  runtime: string
  deployment: string
  latency: string
}

export interface AdminProduct {
  id: string
  slug: string
  kind: ProductKind
  status: ProductStatus
  name: string
  shortDescription: string
  description: string
  categories: Category[]
  features: string[]
  categoryLabel: string | null
  tagline: string | null
  highlights: string[]
  capabilities: Capability[]
  architecture: Architecture | null
  protocols: string[]
  demoUrl: string | null
  sortOrder: number
  price: string
  currency: Currency
  billingPeriod: BillingPeriod
  showPrice: boolean
  stripeProductId: string | null
  stripePriceId: string | null
  isStripeLinked: boolean
  isPurchasable: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ProductInput = {
  slug: string
  name: string
  kind: ProductKind
  status: ProductStatus
  shortDescription: string
  description: string
  categories: Category[]
  features: string[]
  categoryLabel: string | null
  tagline: string | null
  highlights: string[]
  capabilities: Capability[]
  architecture: Architecture | null
  protocols: string[]
  demoUrl: string | null
  sortOrder: number
  price: number
  currency: Currency
  billingPeriod: BillingPeriod
  showPrice: boolean
}

export type ListState = 'active' | 'archived'
