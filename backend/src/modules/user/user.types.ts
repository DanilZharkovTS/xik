export type UserRole = 'user' | 'admin' | 'moderator'

export interface User {
  id: string

  email: string
  name: string

  role: UserRole

  created_at: Date
}

export interface UserWithCredentials extends User {
  credentials: {
    id: string
    userId: string
    passwordHash: string
    passwordUpdatedAt: Date
  }
}
