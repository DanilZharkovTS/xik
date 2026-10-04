import { UserRole } from '../user/user.types.js'

export interface Session {
  id: string
  userId: string

  created_at: Date
  last_used_at: Date
  revoked_at: Date | null
}

export interface SessionWithRefreshes extends Session {
  refresh_tokens: RefreshToken[]
}

export interface RefreshToken {
  id: string
  sessionId: string
  tokenHash: string
  created_at: Date
  expires_at: Date
  revoked_at: Date | null
}

export interface TokenPayload {
  id: string
  email: string
  role: UserRole
  sessionId: string
}
