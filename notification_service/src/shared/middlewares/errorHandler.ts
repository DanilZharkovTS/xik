import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { isApiError } from '../utils/ApiError'

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }))

    return res.status(400).json({
      errors,
    })
  }

 if (isApiError(err)) {
   return res.status(err.status).json({
     status: err.status,
     message: err.message,
     code: err.code,
   })
 }


  return res.status(500).json({
    message: 'Something went wrong',
  })
}
