// Відповіді публічного API продуктів (бекенд: GET /api/products/catalog і /api/products/:slug).
export type ProductKind = 'product' | 'agent'

export type ProductStatus = 'production' | 'active' | 'beta' | 'build'

export interface ApiCatalogProduct {
  id: string
  slug: string
  kind: ProductKind
  status: ProductStatus
  name: string
  shortDescription: string
  tagline: string | null
  categoryLabel: string | null
  categories: string[]
  sortOrder: number
  showPrice: boolean
  // Ціна приходить лише якщо showPrice: інакше користувач побачить її вже на оплаті у Stripe.
  price: string | null
  currency: string | null
  billingPeriod: 'week' | 'month' | 'year' | null
  isPurchasable: boolean
  // Мови, на які продукт справді перекладено (англійська є завжди).
  availableLocales: ('en' | 'es' | 'uk')[]
  updatedAt: string
}

export interface ApiProductDetail extends ApiCatalogProduct {
  description: string
  features: string[]
  highlights: string[]
  capabilities: { title: string; description: string }[]
  architecture: {
    stack: string[]
    runtime: string
    deployment: string
    latency: string
  } | null
  protocols: string[]
  demoUrl: string | null
  locale: 'en' | 'es' | 'uk'
}
