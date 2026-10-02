import { Product } from '../products/products.types.js'
import { stripe } from './stripe.js'

export const stripeService = {
  getStripeCheckoutUrl: async (product: Product, metadata) => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: process.env.FRONTEND_URL,
      metadata,
    })

    return session.url
  },
}
