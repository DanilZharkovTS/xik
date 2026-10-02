import React, { ChangeEvent, useState } from 'react'

import { UserRole, UserRoleSelectProps } from '../user.types'
import { userService } from '../user.service'
import useAuthStore from '../../auth/store'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  moderator: 'Moderator',
  user: 'User',
}

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

      toast.error(getErrorMessage(error))
    }
  }

  if (isCurrentUser) {
    return (
      <span className="inline-block rounded-full border border-[var(--t)] px-3 py-1 text-sm">
        {ROLE_LABELS[selectedRole]}
      </span>
    )
  }

  return (
    <select
      aria-label={`Role for ${user.name}`}
      value={selectedRole}
      onChange={onChangeRole}
      className="min-h-11 w-full rounded-xl border border-[var(--l)] bg-[var(--bg)] px-3 text-base outline-none focus:border-[var(--t)]"
    >
      <option value="admin">{ROLE_LABELS.admin}</option>
      <option value="moderator">{ROLE_LABELS.moderator}</option>
      <option value="user">{ROLE_LABELS.user}</option>
    </select>
  )
}