export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: Date
}

export interface UsersSearchProps {
  search: string
}

export interface UserCardProps {
  user: User
}

export interface UserRoleSelectProps {
  user: User
}