import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '../../generated/prisma/client.js'
import { isApiError } from '../utils/ApiError.js'

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err)
  
  if (isApiError(err)) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
    })
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path[0],
      message: issue.message,
    }))

    return res.status(400).json({
      errors,
    })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Resource already exists',
        })

      case 'P2003':
        return res.status(409).json({
          error: 'Related resource does not exist',
        })

      case 'P2011':
        return res.status(400).json({
          error: 'Null constraint violation',
        })

      case 'P2014':
        return res.status(400).json({
          error: 'Required relation violation',
        })

      case 'P2025':
        return res.status(404).json({
          error: 'Resource not found',
        })

      default:
        console.error(err)

        return res.status(500).json({
          error: 'Database error',
        })
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error(err)

    return res.status(500).json({
      error: 'Database query validation error',
    })
  }

  console.error(err)

  return res.status(500).json({
    error: 'Something broke!',
  })
}
