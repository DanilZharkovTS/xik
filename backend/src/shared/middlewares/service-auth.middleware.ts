import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError.js'

export const serviceAuth = {
  verifySubscriptionServiceKey: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const serviceKey = req.headers['x-service-key']

      if (!serviceKey || serviceKey !== process.env.SUBSCRIPTION_SERVICE_KEY) {
        throw ApiError(401, 'Invalid service key', 'UNAUTHORIZED')
      }

      next()
    } catch (err) {
      next(err)
    }
  },
}
