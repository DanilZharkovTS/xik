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

export type ProductBillingPeriod =
  | 'week'
  | 'month'
  | 'year'

export interface Product {
  id: string
  slug: string
  name: string
  shortDescription: string
  description: string
  categories: ProductCategory[]
  features: string[]
  price: string
  currency: ProductCurrency
  billingPeriod: ProductBillingPeriod
  updatedAt: string
  createdAt: string
  isSaved:boolean
}

export type ProductIconName = 'code' | 'content' | string

export interface SavedProduct {
  id: string
  userId: string
  productId: string
  createdAt: Date
  product: Product
}

export interface ProductsResponse {
  products: Product[]
  lastId: string | null
  lastCreatedAt: string | null
}