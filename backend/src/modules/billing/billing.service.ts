import Stripe from 'stripe'
import { ApiError } from '../../shared/utils/ApiError.js'
import { TokenPayload } from '../auth/auth.types.js'
import { productsRepo } from '../products/products.repo.js'
import { CheckoutSessionDto } from './billing.schema.js'
import { stripeService } from './stripe.service.js'

export const billingService = {
  createCheckoutSession: async (
    user: TokenPayload,
    data: CheckoutSessionDto
  ) => {
    const product = await productsRepo.findById(data.productId)

    if (!product || product.archivedAt) {
      throw ApiError(404, 'NOT_FOUND', 'Product not found')
    }

    // Без ціни у Stripe оплатити нічого: це не помилка клієнта, а стан продукту.
    if (!product.stripePriceId) {
      throw ApiError(409, 'NOT_PURCHASABLE', 'This product cannot be purchased yet')
    }

    const url = await stripeService.getStripeCheckoutUrl(product, {
      userId: user.id,
      productId: product.id,
    })

    return { response: { url } }
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
