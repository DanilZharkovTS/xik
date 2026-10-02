import { Prisma } from '../../generated/prisma/client.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { stripe } from './stripe.js'

// Валюти без копійок: у Stripe сума в цілих одиницях, а не в сотих.
const ZERO_DECIMAL = new Set(['JPY'])

export interface StripePricing {
  price: Prisma.Decimal | number | string
  currency: string
  billingPeriod: 'week' | 'month' | 'year'
}

export const toStripeAmount = (
  price: StripePricing['price'],
  currency: string
): number => {
  const amount = new Prisma.Decimal(price)

  return (ZERO_DECIMAL.has(currency) ? amount : amount.mul(100))
    .toDecimalPlaces(0)
    .toNumber()
}

// Усі помилки Stripe стають 502: наш запит коректний, збій на стороні платіжного сервісу.
const guard = async <T>(action: () => Promise<T>): Promise<T> => {
  try {
    return await action()
  } catch (err) {
    console.error('Stripe error:', err instanceof Error ? err.message : err)
    throw ApiError(
      502,
      'STRIPE_ERROR',
      'Stripe request failed. Nothing was changed, try again.'
    )
  }
}

export const stripeCatalog = {
  createPrice: (stripeProductId: string, pricing: StripePricing) =>
    guard(async () => {
      const price = await stripe.prices.create({
        product: stripeProductId,
        currency: pricing.currency.toLowerCase(),
        unit_amount: toStripeAmount(pricing.price, pricing.currency),
        recurring: { interval: pricing.billingPeriod },
      })
      return price.id
    }),
  createProductWithPrice: (
    product: { id: string; slug: string; name: string; description: string },
    pricing: StripePricing
  ) =>
    guard(async () => {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: { productId: product.id, slug: product.slug },
      })

      try {
        const price = await stripe.prices.create({
          product: stripeProduct.id,
          currency: pricing.currency.toLowerCase(),
          unit_amount: toStripeAmount(pricing.price, pricing.currency),
          recurring: { interval: pricing.billingPeriod },
        })
        return { stripeProductId: stripeProduct.id, stripePriceId: price.id }
      } catch (err) {
        // Не лишаємо у Stripe продукт без ціни, якого наша БД не знає.
        await stripe.products.update(stripeProduct.id, { active: false }).catch(() => undefined)
        throw err
      }
    }),
  updateProductInfo: (
    stripeProductId: string,
    data: { name?: string; description?: string; slug?: string }
  ) =>
    guard(async () => {
      await stripe.products.update(stripeProductId, {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.slug !== undefined && { metadata: { slug: data.slug } }),
      })
    }),
  setProductActive: (stripeProductId: string, active: boolean) =>
    guard(async () => {
      await stripe.products.update(stripeProductId, { active })
    }),
  deactivatePrice: (stripePriceId: string) =>
    guard(async () => {
      await stripe.prices.update(stripePriceId, { active: false })
    }),
  // Для звірки: що зараз у Stripe. null означає, що обʼєкта там немає.
  retrieveProduct: (stripeProductId: string) =>
    guard(async () => {
      try {
        return await stripe.products.retrieve(stripeProductId)
      } catch (err) {
        if ((err as { code?: string }).code === 'resource_missing') return null
        throw err
      }
    }),
  retrievePrice: (stripePriceId: string) =>
    guard(async () => {
      try {
        return await stripe.prices.retrieve(stripePriceId)
      } catch (err) {
        if ((err as { code?: string }).code === 'resource_missing') return null
        throw err
      }
    }),
}
