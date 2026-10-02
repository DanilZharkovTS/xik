import React from 'react'

import { UserCardProps } from '../user.types'
import { UserRoleSelect } from './UserRoleSelect'
import useAuthStore from '../../auth/store'

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isCurrentUser = currentUserId === user.id

  return (
   <div
  className={`relative flex flex-col gap-4 px-4 py-4 transition-colors md:flex-row md:items-center md:justify-between ${
    isCurrentUser
      ? 'bg-muted/40 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-foreground'
      : 'hover:bg-muted/20'
  }`}
>
  <div className="min-w-0">
    <div className="flex items-center gap-2">
      <p className="truncate font-medium">{user.name}</p>

      {isCurrentUser && (
        <span className="text-xs text-foreground-muted">
          · you
        </span>
      )}
    </div>

    <p className="mt-1 truncate text-sm text-foreground-muted">
      {user.email}
    </p>
  </div>

  <div className="flex items-center gap-4">
    <span className="text-xs text-foreground-muted">
      Role
    </span>

    <UserRoleSelect user={user} />
  </div>
</div>
  )
}