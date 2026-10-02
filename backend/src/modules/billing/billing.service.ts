import Stripe from 'stripe'
import { ApiError } from '../../shared/utils/ApiError.js'
import { TokenPayload } from '../auth/auth.types.js'
import { productsRepo } from '../products/products.repo.js'
import { CreateProductDto } from '../products/products.schema.js'
import { Product } from '../products/products.types.js'
import { CheckoutSessionDto } from './billing.schema.js'
import { stripe } from './stripe.js'
import { stripeService } from './stripe.service.js'

export const billingService = {
  createCheckoutSession: async (
    user: TokenPayload,
    data: CheckoutSessionDto
  ) => {
    const product = await productsRepo.findById(data.productId)

    if (!product) {
      throw ApiError(404, 'Product not found', 'NOT_FOUND')
    }

    const url = await stripeService.getStripeCheckoutUrl(product, {
      userId: user.id,
      productId: product.id,
    })

    return { response: { url } }
  },
  createStripeProduct: async (product: Product) => {
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description,

      metadata: {
        productId: product.id,
      },
    })
    const stripePrice = await billingService.createStripePrice(
      stripeProduct.id,
      product
    )

    return { stripeProduct, stripePrice }
  },
  createStripePrice: async (stripeProductId: string, product: Product) => {
    const stripePrice = await stripe.prices.create({
      product: stripeProductId,
      currency: product.currency,
      unit_amount: product.price.mul(100).toNumber(),
      recurring: {
        interval: product.billingPeriod,
      },
    })
    return stripePrice
  },
  deactivateStripeProduct: async (stripeProductId: string) => {
    await stripe.products.update(stripeProductId, {
      active: false,
    })
  },
  deactivateStripePrice: async (stripePriceId: string) => {
    await stripe.prices.update(stripePriceId, {
      active: false,
    })
  },
  updateStripeProduct: async (
    stripeProductId: string,
    product: Product,
    data
  ) => {
    await stripe.products.update(stripeProductId, {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
    })

    if (
      data.price !== undefined ||
      data.billingPeriod !== undefined ||
      data.currency !== undefined
    ) {
      const newPrice = await billingService.createStripePrice(
        stripeProductId,
        product
      )

      await billingService.deactivateStripePrice(product.stripePriceId)

      await productsRepo.updateStripePriceIdById(product.id, newPrice.id)
    }
  },
  handleWebhookEvent: async (event: Stripe.Event) => {
    console.log('Webhook event received:', event.type)

    const handler =
      webhookEventHandler[event.type as keyof typeof webhookEventHandler]

    if (handler) {
      await handler(event)
    } else {
      console.log(`No handler registered for event type: ${event.type}`)
    }

    return
  },
  handleInvoicePaid: async (event: Stripe.Event) => {
    console.log('Handling invoice.paid event...')
  },
  handleInvoicePaymentFailed: async (event: Stripe.Event) => {
    console.log('Handling invoice.payment_failed event. Sending notification email...')
    const res = await fetch(
      `${process.env.NOTIFICATIONS_SERVICE_URL}/api/email/payment-attempt-failed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          service_token: process.env.NOTIFICATIONS_SERVICE_SECRET || '',
        },
        body: JSON.stringify({
          to: 'zharkov.danik.ua@gmail.com',
          productName: 'hepler',
          userName: 'Danil',
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Failed to send notification email. Status:', res.status, 'Error:', err)
    } else {
      const data = await res.json()
      console.log('Notification email sent successfully! Response:', data)
    }
  },
  handleSubscriptionDeleted: async (event: Stripe.Event) => {
    console.log('Handling customer.subscription.deleted event...')
  },
}

const webhookEventHandler = {
  'invoice.paid': billingService.handleInvoicePaid,
  'invoice.payment_failed': billingService.handleInvoicePaymentFailed,
  'customer.subscription.deleted': billingService.handleSubscriptionDeleted,
}
