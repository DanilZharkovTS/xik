import { NextFunction, Request, Response } from 'express'
import { findUsersSchema } from './user.schema.js'

export const userMiddleware = {
  validateFindUsersQuery: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const validQuery = findUsersSchema.parse(req.query)

      req.validData = { query: validQuery }
      next()
    } catch (err) {
      next(err)
    }
  },
}
