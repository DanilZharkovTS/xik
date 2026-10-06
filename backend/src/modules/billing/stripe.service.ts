import { Product } from '../products/products.types.js'
import { stripe } from './stripe.js'

export const stripeService = {
  getStripeCheckoutUrl: async (
    product: Product,
    metadata: { userId: string; productId: string },
    locale: 'en' | 'es' | 'uk' = 'en'
  ) => {
    // Англійська без префікса, es і uk з префіксом: так само, як адреси сайту.
    const prefix = locale === 'en' ? '' : `/${locale}`
    // Stripe Checkout не має української; для неї мову вибере сам браузер покупця.
    const stripeLocale = locale === 'uk' ? 'auto' : locale

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.stripePriceId!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      locale: stripeLocale,
      success_url: `${process.env.FRONTEND_URL}${prefix}/success`,
      cancel_url: `${process.env.FRONTEND_URL}${prefix || '/'}`,
      metadata,
      subscription_data: { metadata },
    })

    return session.url
  },
  cancelSubscription: async (subscriptionId: string) => {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  },
}
