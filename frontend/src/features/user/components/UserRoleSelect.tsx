import React, { ChangeEvent, useState } from 'react'

import { UserRole, UserRoleSelectProps } from '../user.types'
import { userService } from '../user.service'
import useAuthStore from '../../auth/store'
import { toast } from 'sonner'

export const UserRoleSelect: React.FC<UserRoleSelectProps> = ({ user }) => {
  const token = useAuthStore((state) => state.accessToken)
  const currentUserId = useAuthStore((state) => state.user?.id)

  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)

  const isCurrentUser = currentUserId === user.id

  const onChangeRole = async (e: ChangeEvent<HTMLSelectElement>) => {
    if (!token || isCurrentUser) return

    const newRole = e.target.value as UserRole

    setSelectedRole(newRole)

    try {
      await userService.changeRole(user.id, newRole, token)
    } catch (error) {
      setSelectedRole(user.role)

      if (error instanceof Error) {
        toast.error(error.message)
      }

      console.error(error)
    }
  }

  if (isCurrentUser) {
    return (
      <span className="text-sm text-foreground-muted">
        {selectedRole === 'admin' ? 'Admin' : 'User'}
      </span>
    )
  }

  return (
    <select
      value={selectedRole}
      onChange={onChangeRole}
      className="cursor-pointer border-pixel border-border bg-background px-3 py-2 font-mono text-xs uppercase tracking-wider outline-none transition-colors hover:bg-muted focus:border-foreground"
    >
      <option value="admin">Admin</option>
      <option value="user">User</option>
    </select>
  )
}