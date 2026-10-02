import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'

export const validateBody = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.body)

      req.validData = {
        ...req.validData,
        body: data,
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
