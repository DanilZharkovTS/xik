import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '../../generated/prisma/client.js'
import { isApiError } from '../utils/ApiError.js'

// Помилки Prisma можуть містити вхідні дані запиту, зокрема хеші паролів: у лог їх не пишемо.
export const redact = (err: unknown): unknown => {
  if (!(err instanceof Error)) return err

  const clean = new Error(
    err.message.replace(
      /(passwordHash|password|tokenHash)(["']?\s*[:=]\s*)(["'])[^"']*\3/gi,
      '$1$2$3[redacted]$3'
    )
  )
  clean.name = err.name
  clean.stack = err.stack?.replace(err.message, clean.message)
  return clean
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bodyError = (err as { type?: string } | null)?.type

  // Помилки розбору тіла запиту (body-parser) це помилки клієнта, а не збій сервера.
  if (bodyError === 'entity.too.large') {
    return res
      .status(413)
      .json({ code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' })
  }

  if (bodyError === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ code: 'BAD_REQUEST', message: 'Invalid request body' })
  }

  console.error(redact(err))

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
        console.error(redact(err))

        return res.status(500).json({
          error: 'Database error',
        })
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error(redact(err))

    return res.status(500).json({
      error: 'Database query validation error',
    })
  }

  console.error(redact(err))

  return res.status(500).json({
    error: 'Something broke!',
  })
}
