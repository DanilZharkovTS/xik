import { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/ApiError.js'
import z from 'zod'
import { paginateSchema } from '../schemas/helpers.schema.js'

export const validateParams = (...names: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validParams: Record<string, string> = {}

      for (const name of names) {
        const param = req.params[name]

        if (!param) {
          throw ApiError(400, 'BAD_REQUEST', `Missing param ${name}`)
        }
        if (typeof param !== 'string') {
          throw ApiError(400, 'BAD_REQUEST', `Invalid param ${name}`)
        }

        validParams[name] = param as string
      }

      req.validData = {
        ...req.validData,
        params: {
          ...(req.validData?.params ?? {}),
          ...validParams,
        },
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

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

export const validateQuery = (schema: z.ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.query)

      req.validData = {
        ...req.validData,
        query: data,
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}

export const validateParamsString = (...names: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validParams: Record<string, string> = {}

      for (const name of names) {
        const param = req.params[name]

        if (!param) {
          throw ApiError(400, 'BAD_REQUEST', `Missing param ${name}`)
        }

        if (typeof param !== 'string') {
          throw ApiError(400, 'BAD_REQUEST', `Invalid param ${name}`)
        }

        validParams[name] = param
      }

      req.validData = {
        ...req.validData,
        params: {
          ...(req.validData?.params ?? {}),
          ...validParams,
        },
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

export const paginate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = paginateSchema.parse(req.query)

    req.pagination = {
      lastCreatedAt: data.lastCreatedAt,
      lastId: data.lastId,
    }
    next()
  } catch (err) {
    next(err)
  }
}
