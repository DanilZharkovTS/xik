import React from 'react'

import type { UserCardProps } from '../user.types'
import { UserRoleSelect } from './UserRoleSelect'
import useAuthStore from '../../auth/store'
import { useI18n } from '@/src/shared/i18n/use-i18n'

// Картка для телефона; на ширших екранах той самий список показується таблицею.
export const UserCard: React.FC<UserCardProps> = ({ user, onRoleChanged }) => {
  const { t, locale } = useI18n()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const isCurrentUser = currentUserId === user.id

  return (
    <li className="min-w-0 space-y-2 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3">
      <div className="min-w-0">
        <p className="truncate text-lg font-medium">
          {user.name}
          {isCurrentUser && <span className="text-sm font-normal text-[var(--m)]"> · {t('users.you')}</span>}
        </p>
        <p className="truncate text-sm text-[var(--m)]">{user.email}</p>
        <p className="text-xs text-[var(--m)]">
          {t('users.joined', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(user.createdAt)) })}
          {user.deactivatedAt && ` · ${t('users.deactivated')}`}
        </p>
      </div>

      <UserRoleSelect user={user} onRoleChanged={onRoleChanged} />
    </li>
  )
}
