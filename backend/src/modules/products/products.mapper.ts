import type { Product } from './products.types.js'

type ContentLocale = 'en' | 'es' | 'uk'

interface Translation {
  name?: string
  shortDescription?: string
  description?: string
  tagline?: string
  categoryLabel?: string
  features?: string[]
  highlights?: string[]
  capabilities?: { title: string; description: string }[]
  architecture?: { runtime?: string; deployment?: string; latency?: string }
}

const translationOf = (product: Product, lang: ContentLocale): Translation => {
  if (lang === 'en') return {}

  const all = (product.translations ?? {}) as Partial<Record<'es' | 'uk', Translation>>
  return all[lang] ?? {}
}

// Переклад вважається готовим, коли є і короткий, і повний опис. Це ж правило бачить сайт:
// без нього сторінка мови показує англійський текст і не потрапляє в індекс.
const isTranslated = (translation: Translation): boolean =>
  Boolean(translation.shortDescription?.trim() && translation.description?.trim())

export const availableLocales = (product: Product): ContentLocale[] => [
  'en',
  ...(['es', 'uk'] as const).filter((lang) => isTranslated(translationOf(product, lang))),
]

const text = (value: string | undefined, fallback: string): string =>
  value?.trim() ? value : fallback

const list = <T>(value: T[] | undefined, fallback: T[]): T[] =>
  value && value.length > 0 ? value : fallback

// Контент продукту потрібною мовою; незаповнені поля беруться з англійської.
export const localizedContent = (product: Product, lang: ContentLocale = 'en') => {
  const tr = translationOf(product, lang)
  const base = (product.architecture ?? null) as
    | { stack: string[]; runtime: string; deployment: string; latency: string }
    | null

  return {
    name: text(tr.name, product.name),
    shortDescription: text(tr.shortDescription, product.shortDescription),
    description: text(tr.description, product.description),
    tagline: tr.tagline?.trim() ? tr.tagline : product.tagline,
    categoryLabel: tr.categoryLabel?.trim() ? tr.categoryLabel : product.categoryLabel,
    features: list(tr.features, product.features),
    highlights: list(tr.highlights, product.highlights),
    capabilities: list(
      tr.capabilities,
      (product.capabilities ?? []) as { title: string; description: string }[]
    ),
    architecture: base
      ? {
          ...base,
          runtime: text(tr.architecture?.runtime, base.runtime),
          deployment: text(tr.architecture?.deployment, base.deployment),
          latency: text(tr.architecture?.latency, base.latency),
        }
      : null,
  }
}

// Ціну показуємо лише якщо showPrice: інакше користувач побачить її вже на оплаті у Stripe.
const publicPrice = (product: Product) =>
  product.showPrice
    ? {
        price: product.price.toString(),
        currency: product.currency,
        billingPeriod: product.billingPeriod,
      }
    : { price: null, currency: null, billingPeriod: null }

// Придатний до оплати: є ціна у Stripe й продукт не в архіві.
export const isPurchasable = (product: Product): boolean =>
  product.stripePriceId !== null && product.archivedAt === null

// Картка в списку (блоки на головній).
export const toCatalogDto = (product: Product, lang: ContentLocale = 'en') => {
  const content = localizedContent(product, lang)

  return {
  id: product.id,
  slug: product.slug,
  kind: product.kind,
  status: product.status,
  name: content.name,
  shortDescription: content.shortDescription,
  tagline: content.tagline,
  categoryLabel: content.categoryLabel,
  categories: product.categories,
  sortOrder: product.sortOrder,
  showPrice: product.showPrice,
  ...publicPrice(product),
  isPurchasable: isPurchasable(product),
  availableLocales: availableLocales(product),
  updatedAt: product.updatedAt,
  }
}

// Сторінка продукту. Stripe-ідентифікатори назовні не віддаємо.
export const toPublicDto = (product: Product, isSaved = false, lang: ContentLocale = 'en') => {
  const content = localizedContent(product, lang)

  return {
  ...toCatalogDto(product, lang),
  description: content.description,
  features: content.features,
  highlights: content.highlights,
  capabilities: content.capabilities,
  architecture: content.architecture,
  locale: lang,
  protocols: product.protocols,
  demoUrl: product.demoUrl,
  isSaved,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  }
}

// Для адміна: усе, зокрема Stripe-привʼязка й справжня ціна незалежно від showPrice.
export const toAdminDto = (product: Product) => ({
  id: product.id,
  slug: product.slug,
  kind: product.kind,
  status: product.status,
  name: product.name,
  shortDescription: product.shortDescription,
  description: product.description,
  categories: product.categories,
  features: product.features,
  categoryLabel: product.categoryLabel,
  tagline: product.tagline,
  highlights: product.highlights,
  capabilities: product.capabilities,
  architecture: product.architecture,
  protocols: product.protocols,
  demoUrl: product.demoUrl,
  sortOrder: product.sortOrder,
  translations: (product.translations ?? {}) as Record<string, unknown>,
  price: product.price.toString(),
  currency: product.currency,
  billingPeriod: product.billingPeriod,
  showPrice: product.showPrice,
  stripeProductId: product.stripeProductId,
  stripePriceId: product.stripePriceId,
  isStripeLinked: product.stripeProductId !== null && product.stripePriceId !== null,
  isPurchasable: isPurchasable(product),
  archivedAt: product.archivedAt,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
})
