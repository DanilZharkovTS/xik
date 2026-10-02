import { TokenPayload } from '../../modules/auth/auth.types.ts'

declare global {
  namespace Express {
    interface Request {
      validBody?: any
      validData?: {
        body?: any
        params?: any
        query?: any
      }
      pagination?: {
        lastCreatedAt?: Date
        lastId?: string
      }
      tokens?: Record<string, string>
      user: TokenPayload
    }
  }
}

export interface Pagination {
  lastCreatedAt?: Date
  lastId?: string
}

export {}
