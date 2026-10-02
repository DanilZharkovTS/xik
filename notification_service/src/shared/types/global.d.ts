import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      validData: {
        body?: any
        params?: any
        query?: any
      }
    }
  }
}