export type UserRole = 'user' | 'admin' | 'moderator'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  deactivatedAt: string | null
}

export interface UsersQuery {
  q?: string
  role?: UserRole
  cursor?: { lastId: string; lastCreatedAt: string }
}

export interface UsersPage {
  users: User[]
  hasMore: boolean
  lastId?: string
  lastCreatedAt?: string
}

export interface UserCardProps {
  user: User
  onRoleChanged: (user: User) => void
}

export interface UserRoleSelectProps {
  user: User
  onRoleChanged: (user: User) => void
}
