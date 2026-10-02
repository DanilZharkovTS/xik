import z from 'zod'
import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { tokenService } from '../../shared/services/token.service.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { UserRole } from '../user/user.types.js'

export const authMiddleware = {
  hashTokens: (...names: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const tokens = {}

      for (const name of names) {
        const token = req.cookies[name]

        if (!token) {
          throw ApiError(401, 'UNAUTHORIZED', 'Missing token')
        }

        const hashedToken = tokenService.hash(token)
        tokens[name] = hashedToken
      }

      req.tokens = { ...req.tokens, ...tokens }
      next()
    }
  },
  verifyAccess: (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]

      if (!token) {
        throw ApiError(401, 'UNAUTHORIZED', 'Missing token')
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET!, {
        algorithms: ['HS256'],
      }) as { id: string; email: string; role: UserRole; sessionId: string }

      req.user = payload
      next()
    } catch (err) {
      throw ApiError(401, 'UNAUTHORIZED', 'Invalid token')
    }
  },
  verifyOptionalAccess: (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]

      const payload = jwt.verify(token, process.env.JWT_SECRET!, {
        algorithms: ['HS256'],
      }) as { id: string; email: string; role: UserRole; sessionId: string }

      req.user = payload
      next()
    } catch (err) {
      req.user = null
      next()
    }
  },
  requiresRole: (role: UserRole) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.user.role !== role) {
        throw ApiError(403, 'FORBIDDEN', 'Access denied')
      }
      next()
    }
  },
}
