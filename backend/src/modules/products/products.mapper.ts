import type { Product } from './products.types.js'

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
export const toCatalogDto = (product: Product) => ({
  id: product.id,
  slug: product.slug,
  kind: product.kind,
  status: product.status,
  name: product.name,
  shortDescription: product.shortDescription,
  tagline: product.tagline,
  categoryLabel: product.categoryLabel,
  categories: product.categories,
  sortOrder: product.sortOrder,
  showPrice: product.showPrice,
  ...publicPrice(product),
  isPurchasable: isPurchasable(product),
})

// Сторінка продукту. Stripe-ідентифікатори назовні не віддаємо.
export const toPublicDto = (product: Product, isSaved = false) => ({
  ...toCatalogDto(product),
  description: product.description,
  features: product.features,
  highlights: product.highlights,
  capabilities: product.capabilities,
  architecture: product.architecture,
  protocols: product.protocols,
  demoUrl: product.demoUrl,
  isSaved,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
})

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
