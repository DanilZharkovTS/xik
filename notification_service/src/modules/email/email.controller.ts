import { Request, Response, NextFunction } from 'express'
import { emailService } from './email.service'

export const emailController = { 
  sendSigningKey: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendSigningKey(req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendCanceledSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendCanceledSubscription(req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendDeletedSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendDeletedSubscription(req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendPaymentAttemptFailed: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendPaymentAttemptFailed(req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendSubscriptionStarted: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendSubscriptionStarted(req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
}
