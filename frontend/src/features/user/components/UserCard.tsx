import React from 'react'

import { UserCardProps } from '../user.types'
import { UserRoleSelect } from './UserRoleSelect'
import useAuthStore from '../../auth/store'

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isCurrentUser = currentUserId === user.id

  return (
    <li className="space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4">
      <div className="min-w-0">
        <p className="truncate text-lg font-medium">
          {user.name}
          {isCurrentUser && <span className="text-sm font-normal text-[var(--m)]"> · you</span>}
        </p>
        <p className="truncate text-sm text-[var(--m)]">{user.email}</p>
      </div>

      <UserRoleSelect user={user} />
    </li>
  )
}
