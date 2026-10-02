import { NextFunction, Request, Response } from "express"
import { ApiError } from "../../shared/utils/ApiError.js"
import { stripe } from "./stripe.js"

export const billingMiddlewares = {
  validateWebhookSignature: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('--- Incoming webhook request received! ---')
      const signature = req.headers['stripe-signature']

      if (!signature) {
        console.error('Webhook error: Missing stripe-signature header')
        throw ApiError(401, 'Invalid signature', 'UNAUTHORIZED')
      }

      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )

      console.log('Webhook signature verified successfully! Event type:', event.type)
      req.validData = { body: event }
      next()
    } catch (err) {
      console.error('Webhook signature validation error:', err)
      next(err)
    }
  },
}
