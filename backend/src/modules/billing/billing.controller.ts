import { NextFunction, Request, Response } from "express"
import { billingService } from "./billing.service.js"

export const billingController = {
  redirectToCkeckout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await billingService.createCheckoutSession(req.user, req.validData!.body)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  stripeWebhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('--- billingController.stripeWebhook called ---')
      await billingService.handleWebhookEvent(req.validData!.body)
      res.status(200).json({ message: 'success' })
    } catch (err) {
      console.error('Controller error in stripeWebhook:', err)
      next(err)
    }
  }
}
