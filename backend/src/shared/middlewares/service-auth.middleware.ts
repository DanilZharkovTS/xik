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
      const expectedKey = process.env.SUBSCRIPTION_SERVICE_KEY



      if (expectedKey && (!serviceKey || serviceKey !== expectedKey)) {
        throw ApiError(401, 'Invalid service key', 'UNAUTHORIZED')
      }



      next()
    } catch (err) {
      next(err)
    }
  },
}
