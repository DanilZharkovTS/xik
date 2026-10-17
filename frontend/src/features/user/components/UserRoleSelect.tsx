'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { UserRole, UserRoleSelectProps } from '../user.types'
import { userService } from '../user.service'
import useAuthStore from '../../auth/store'
import { Picker } from '@/src/shared/ui/picker'
import { useConfirm } from '@/src/shared/ui/confirm'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'

const ROLES: UserRole[] = ['admin', 'moderator', 'user']

// Зміна ролі: підвищення до адміна й зняття ролі модератора потребують підтвердження,
// результат показується тостом. Новому модератору одразу пропонуємо дати продукти.
export const UserRoleSelect: React.FC<UserRoleSelectProps> = ({ user, onRoleChanged }) => {
  const { t } = useI18n()
  const up = useUrlLocalePath()
  const router = useRouter()
  const confirm = useConfirm()
  const token = useAuthStore((state) => state.accessToken)
  const currentUserId = useAuthStore((state) => state.user?.id)

  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)
  const [isSaving, setIsSaving] = useState(false)

  const isCurrentUser = currentUserId === user.id
  const name = user.name || user.email

  const askToConfirm = async (newRole: UserRole): Promise<boolean> => {
    if (newRole === 'admin') {
      return confirm({
        title: t('users.confirmAdmin.title', { name }),
        description: t('users.confirmAdmin.text'),
        confirmLabel: t('users.confirmAdmin.ok'),
        tone: 'danger',
      })
    }
    if (user.role === 'admin') {
      return confirm({
        title: t('users.confirmDemote.title', { name }),
        description: t('users.confirmDemote.text'),
        confirmLabel: t('users.confirmDemote.ok'),
        tone: 'danger',
      })
    }
    if (user.role === 'moderator' && newRole === 'user') {
      return confirm({
        title: t('users.confirmRemoveModerator.title', { name }),
        description: t('users.confirmRemoveModerator.text'),
        confirmLabel: t('users.confirmRemoveModerator.ok'),
        tone: 'danger',
      })
    }
    return true
  }

  const onChangeRole = async (newRole: UserRole) => {
    if (!token || isCurrentUser || newRole === selectedRole) return
    if (!(await askToConfirm(newRole))) return

    setSelectedRole(newRole)
    setIsSaving(true)

    try {
      await userService.changeRole(user.id, newRole, token)
      onRoleChanged({ ...user, role: newRole })

      if (newRole === 'moderator') {
        toast.success(t('users.roleChanged', { name, role: t(`role.${newRole}`) }), {
          description: t('users.moderatorNeedsProducts'),
          action: {
            label: t('users.assignProducts'),
            onClick: () => router.push(up(`/admin/team?assign=${encodeURIComponent(user.id)}`)),
          },
          duration: 10000,
        })
      } else {
        toast.success(t('users.roleChanged', { name, role: t(`role.${newRole}`) }))
      }
    } catch (error) {
      setSelectedRole(user.role)
      toast.error(getErrorMessage(error))
    } finally {
      setIsSaving(false)
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
      label={t('users.roleFor', { name })}
      hideLabel
      value={selectedRole}
      disabled={isSaving}
      onChange={(role) => void onChangeRole(role as UserRole)}
      options={ROLES.map((role) => ({ value: role, label: t(`role.${role}`) }))}
    />
  )
}
