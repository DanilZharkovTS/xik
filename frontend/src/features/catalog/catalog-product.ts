import type { Locale } from '@/src/shared/i18n/i18n-store'
import { translate } from '@/src/shared/i18n/translate'
import type { CatalogItem } from './data/catalog-items'
import type { ApiCatalogProduct, ApiProductDetail, ProductKind, ProductStatus } from './catalog.types'

export const statusLabel = (status: ProductStatus, locale: Locale = 'en'): string =>
  translate(locale, `catalog.status.${status}`)

const INTL_LOCALE: Record<Locale, string> = { en: 'en-US', es: 'es-ES', uk: 'uk-UA' }

// Маршрут сторінки за типом: це єдине місце, що знає, як kind перетворюється на URL.
export const productHref = (product: Pick<ApiCatalogProduct, 'kind' | 'slug'>): string =>
  product.kind === 'agent' ? `/ai/${product.slug}` : `/products/${product.slug}`

// "$29 / month". Порожній рядок, якщо ціну сховано (showPrice вимкнено).
export function formatPrice(
  product: Pick<ApiCatalogProduct, 'price' | 'currency' | 'billingPeriod'>,
  locale: Locale = 'en',
): string {
  if (product.price === null || product.currency === null || product.billingPeriod === null) {
    return ''
  }

  const amount = Number(product.price)
  const formatted = new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: 'currency',
    currency: product.currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)

  return `${formatted} / ${translate(locale, `price.${product.billingPeriod}`)}`
}

// Сторінка деталей і досі малюється компонентом CatalogItemDetail, тому дані з API
// приводяться до його форми. Порожні необовʼязкові поля мають розумні значення за замовчуванням.
export function toCatalogItem(product: ApiProductDetail, locale: Locale = 'en'): CatalogItem {
  return {
    id: product.id,
    slug: product.slug,
    type: product.kind,
    typeLabel: translate(locale, `catalog.type.${product.kind}`),
    title: product.name,
    subtitle: product.shortDescription,
    category: product.categoryLabel ?? product.categories.join(' · '),
    status: product.status,
    statusLabel: statusLabel(product.status, locale),
    description: product.description,
    tagline: product.tagline ?? product.shortDescription,
    highlights: product.highlights,
    capabilities: product.capabilities,
    architecture: product.architecture ?? { stack: [], runtime: '', deployment: '', latency: '' },
    protocols: product.protocols,
    demoUrl: product.demoUrl ?? undefined,
  }
}
