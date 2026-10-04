import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { tokenService } from '../../shared/services/token.service.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { UserRole } from '../user/user.types.js'
import { sessionRepo } from './repos/session.repo.js'
import type { TokenPayload } from './auth.types.js'

// JWT сам по собі нічого не гарантує: сесію можуть відкликати, акаунт деактивувати,
// роль змінити. Тому кожен запит звіряється з БД, а роль береться звідти, не з токена.
const authenticate = async (req: Request): Promise<TokenPayload> => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    throw ApiError(401, 'UNAUTHORIZED', 'Missing token')
  }

  let payload: TokenPayload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
    }) as TokenPayload
  } catch {
    throw ApiError(401, 'UNAUTHORIZED', 'Invalid token')
  }

  const session = await sessionRepo.findActiveWithUser(payload.sessionId)

  if (
    !session ||
    session.revokedAt ||
    session.userId !== payload.id ||
    session.user.deactivatedAt
  ) {
    throw ApiError(401, 'UNAUTHORIZED', 'Session is expired or invalid')
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    sessionId: session.id,
  }
}

export const authMiddleware = {
  hashTokens: (...names: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const tokens: Record<string, string> = {}

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
  verifyAccess: async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.user = await authenticate(req)
      next()
    } catch (err) {
      next(err)
    }
  },
  verifyOptionalAccess: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      req.user = await authenticate(req)
    } catch (err) {
      delete (req as { user?: TokenPayload }).user
    }
    next()
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
