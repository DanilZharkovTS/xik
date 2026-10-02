import { Request, Response, NextFunction } from 'express'
import { isApiError, ApiError } from '../utils/ApiError'

export const serviceAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers?.['service_token']

    if (!token || token !== process.env.SERVICE_TOKEN) {
      throw ApiError(401, 'Unauthorized', 'UNAUTHORIZED')
    }

    next()
  } catch (err) {
    next(err)
  }
}
