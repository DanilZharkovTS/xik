import { NextFunction, Request, Response } from 'express'
import { billingService } from './billing.service.js'

export const billingController = {
  redirectToCkeckout: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await billingService.createCheckoutSession(
        req.user,
        req.validData!.body
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  stripeWebhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(
        `--- billingController.stripeWebhook: ${req.validData!.body.type} (${req.validData!.body.id}) ---`
      )
      await billingService.handleWebhookEvent(req.validData!.body)
      res.status(200).json({ message: 'success' })
    } catch (err) {
      console.error('Controller error in stripeWebhook:', err)
      next(err)
    }
  },
  cancelSubscription: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await billingService.cancelSubscription(
        req.user,
        req.validData!.params.subscriptionId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}
