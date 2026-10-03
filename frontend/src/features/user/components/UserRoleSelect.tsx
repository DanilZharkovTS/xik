import React, { useState } from 'react'

import { UserRole, UserRoleSelectProps } from '../user.types'
import { userService } from '../user.service'
import useAuthStore from '../../auth/store'
import { toast } from 'sonner'

import { Picker } from '@/src/shared/ui/picker'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const ROLES: UserRole[] = ['admin', 'moderator', 'user']

export const UserRoleSelect: React.FC<UserRoleSelectProps> = ({ user }) => {
  const { t } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const currentUserId = useAuthStore((state) => state.user?.id)

  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)

  const isCurrentUser = currentUserId === user.id

  const onChangeRole = async (newRole: UserRole) => {
    if (!token || isCurrentUser) return

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
        {t(`role.${selectedRole}`)}
      </span>
    )
  }

  return (
    <Picker
      label={t('users.roleFor', { name: user.name })}
      hideLabel
      value={selectedRole}
      onChange={(role) => onChangeRole(role as UserRole)}
      options={ROLES.map((role) => ({ value: role, label: t(`role.${role}`) }))}
    />
  )
}
