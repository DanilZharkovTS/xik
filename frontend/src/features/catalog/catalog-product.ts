import type { CatalogItem } from './data/catalog-items'
import type { ApiCatalogProduct, ApiProductDetail, ProductKind, ProductStatus } from './catalog.types'

const STATUS_LABELS: Record<ProductStatus, string> = {
  production: 'Production Ready',
  active: 'Active',
  beta: 'Beta',
  build: 'In Development',
}

const TYPE_LABELS: Record<ProductKind, string> = {
  product: 'Software Product',
  agent: 'AI Agent',
}

export const statusLabel = (status: ProductStatus): string => STATUS_LABELS[status]

// Маршрут сторінки за типом: це єдине місце, що знає, як kind перетворюється на URL.
export const productHref = (product: Pick<ApiCatalogProduct, 'kind' | 'slug'>): string =>
  product.kind === 'agent' ? `/ai/${product.slug}` : `/products/${product.slug}`

// "$29 / month". Порожній рядок, якщо ціну сховано (showPrice вимкнено).
export function formatPrice(product: Pick<ApiCatalogProduct, 'price' | 'currency' | 'billingPeriod'>): string {
  if (product.price === null || product.currency === null || product.billingPeriod === null) {
    return ''
  }

  const amount = Number(product.price)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)

  return `${formatted} / ${product.billingPeriod}`
}

// Сторінка деталей і досі малюється компонентом CatalogItemDetail, тому дані з API
// приводяться до його форми. Порожні необовʼязкові поля мають розумні значення за замовчуванням.
export function toCatalogItem(product: ApiProductDetail): CatalogItem {
  return {
    id: product.id,
    slug: product.slug,
    type: product.kind,
    typeLabel: TYPE_LABELS[product.kind],
    title: product.name,
    subtitle: product.shortDescription,
    category: product.categoryLabel ?? product.categories.join(' · '),
    status: product.status,
    statusLabel: STATUS_LABELS[product.status],
    description: product.description,
    tagline: product.tagline ?? product.shortDescription,
    highlights: product.highlights,
    capabilities: product.capabilities,
    architecture: product.architecture ?? { stack: [], runtime: '', deployment: '', latency: '' },
    protocols: product.protocols,
    demoUrl: product.demoUrl ?? undefined,
  }
}
