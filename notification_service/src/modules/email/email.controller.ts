import { Request, Response, NextFunction } from 'express'
import { emailService } from './email.service'

export const emailController = { 
  sendDeviceKey: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendDeviceKey(req.body, req.get('idempotency-key'))
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendCanceledSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendCanceledSubscription(req.body, req.get('idempotency-key'))
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendDeletedSubscription: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendDeletedSubscription(req.body, req.get('idempotency-key'))
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendPaymentAttemptFailed: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendPaymentAttemptFailed(req.body, req.get('idempotency-key'))
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendSubscriptionStarted: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendSubscriptionStarted(req.body, req.get('idempotency-key'))
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendPasswordReset: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendPasswordReset(req.body, req.get('idempotency-key'))
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
  sendPasswordChanged: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await emailService.sendPasswordChanged(req.body, req.get('idempotency-key'))
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
}

