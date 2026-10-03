'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { userService } from '../user.service'
import useAuthStore from '../../auth/store'
import type { User } from '../user.types'
import { UserSearch } from './UserSearch'
import { UserCard } from './UserCard'
import { useI18n } from '@/src/shared/i18n/use-i18n'

export const UsersList = () => {
  const { t } = useI18n()
  const query = useSearchParams()
  const search = query.get('search')

  const token = useAuthStore((state) => state.accessToken)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    let isCancelled = false

    userService
      .findUsers(search, token)
      .then((res) => {
        if (!isCancelled) setUsers(res.users)
      })
      .catch((err: unknown) => {
        if (!isCancelled) toast.error(getErrorMessage(err))
      })
      .finally(() => {
        if (!isCancelled) setLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [token, search])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-3 md:space-y-6 md:py-10">
      <div>
        <h1 className="text-2xl font-medium md:text-4xl">{t('users.title')}</h1>
        <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">{t('users.subtitle')}</p>
      </div>

      <UserSearch search={search || ''} />

      {loading ? (
        <p className="py-12 text-center text-[var(--m)]">{t('common.loading')}</p>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">{t('users.empty')}</p>
          <p className="mt-1 text-sm text-[var(--m)]">{t('users.emptyHint')}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </ul>
      )}
    </div>
  )
}
