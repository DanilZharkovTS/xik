'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { Button } from '@/src/shared/ui/button'
import { Segmented } from '@/src/shared/ui/segmented'
import { RowsSkeleton } from '@/src/shared/ui/skeleton'
import { userService } from '../user.service'
import useAuthStore from '../../auth/store'
import type { User, UserRole } from '../user.types'
import { UserCard } from './UserCard'
import { UserRoleSelect } from './UserRoleSelect'
import { useI18n, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'

type RoleFilter = UserRole | 'all'

const ROLE_FILTERS: RoleFilter[] = ['all', 'admin', 'moderator', 'user']

const isRole = (value: string | null): value is UserRole =>
  value === 'admin' || value === 'moderator' || value === 'user'

// Пошук і фільтр живуть в адресі: посиланням можна поділитися, "назад" повертає попередній стан.
export const UsersList = () => {
  const { t, locale } = useI18n()
  const up = useUrlLocalePath()
  const router = useRouter()
  const params = useSearchParams()
  const q = params.get('q') ?? params.get('search') ?? ''
  const roleParam = params.get('role')
  const role: RoleFilter = isRole(roleParam) ? roleParam : 'all'

  const token = useAuthStore((state) => state.accessToken)
  const currentUserId = useAuthStore((state) => state.user?.id)

  const [searchTerm, setSearchTerm] = useState(q)
  const [users, setUsers] = useState<User[]>([])
  const [cursor, setCursor] = useState<{ lastId: string; lastCreatedAt: string } | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const key = JSON.stringify({ q, role })
  const isLoading = loadedKey !== key

  const setFilters = (next: { q?: string; role?: RoleFilter }) => {
    const search = new URLSearchParams()
    const nextQ = (next.q ?? q).trim()
    const nextRole = next.role ?? role
    if (nextQ) search.set('q', nextQ)
    if (nextRole !== 'all') search.set('role', nextRole)
    const query = search.toString()
    router.replace(up(`/admin/users${query ? `?${query}` : ''}`), { scroll: false })
  }

  // Пошук із паузою, щоб не слати запит на кожну літеру.
  useEffect(() => {
    if (searchTerm.trim() === q) return
    const timer = setTimeout(() => setFilters({ q: searchTerm }), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  useEffect(() => {
    if (!token) return

    let isCancelled = false

    userService
      .findUsers({ q, role: role === 'all' ? undefined : role }, token)
      .then((page) => {
        if (isCancelled) return
        setUsers(page.users)
        setHasMore(page.hasMore)
        setCursor(page.lastId && page.lastCreatedAt ? { lastId: page.lastId, lastCreatedAt: page.lastCreatedAt } : null)
      })
      .catch((err: unknown) => {
        if (!isCancelled) toast.error(getErrorMessage(err))
      })
      .finally(() => {
        if (!isCancelled) setLoadedKey(key)
      })

    return () => {
      isCancelled = true
    }
  }, [token, q, role, key])

  const loadMore = async () => {
    if (!token || !cursor) return

    try {
      setIsLoadingMore(true)
      const page = await userService.findUsers({ q, role: role === 'all' ? undefined : role, cursor }, token)
      setUsers((current) => [...current, ...page.users])
      setHasMore(page.hasMore)
      setCursor(page.lastId && page.lastCreatedAt ? { lastId: page.lastId, lastCreatedAt: page.lastCreatedAt } : null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Після зміни ролі рядок оновлюється на місці; якщо він більше не підходить під фільтр, зникає.
  const onRoleChanged = (changed: User) =>
    setUsers((current) =>
      current
        .map((user) => (user.id === changed.id ? changed : user))
        .filter((user) => role === 'all' || user.role === role),
    )

  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value))

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-3 md:space-y-6 md:py-10">
      <div>
        <h1 className="text-2xl font-medium md:text-4xl">{t('users.title')}</h1>
        <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">{t('users.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--m)]"
          />
          <input
            type="search"
            aria-label={t('users.searchLabel')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('users.searchPlaceholder')}
            className="min-h-10 w-full rounded-full border border-[var(--l)] bg-[var(--bg)] pl-10 pr-4 text-base outline-none focus:border-[var(--t)] md:min-h-11"
          />
        </div>

        <Segmented
          label={t('users.roleFilter')}
          value={role}
          onChange={(value) => setFilters({ role: value })}
          options={ROLE_FILTERS.map((value) => ({
            value,
            label: value === 'all' ? t('users.filter.all') : t(`users.filter.${value}`),
          }))}
          className="md:w-[26rem]"
        />
      </div>

      {isLoading ? (
        <RowsSkeleton label={t('common.loading')} />
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">{t('users.empty')}</p>
          <p className="mt-1 text-sm text-[var(--m)]">{t('users.emptyHint')}</p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((user) => (
              <UserCard key={user.id} user={user} onRoleChanged={onRoleChanged} />
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border border-[var(--l)] md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--s)] text-xs uppercase tracking-wider text-[var(--m)]">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{t('users.col.name')}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t('users.col.email')}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{t('users.col.joined')}</th>
                  <th scope="col" className="w-56 px-4 py-3 font-medium">{t('users.col.role')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-[var(--l)] align-middle">
                    <td className="max-w-[16rem] truncate px-4 py-2.5 font-medium">
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="font-normal text-[var(--m)]"> · {t('users.you')}</span>
                      )}
                      {user.deactivatedAt && (
                        <span className="ml-2 rounded-full border border-[var(--l)] px-2 py-0.5 text-xs font-normal text-[var(--m)]">
                          {t('users.deactivated')}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[18rem] truncate px-4 py-2.5 text-[var(--m)]">{user.email}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--m)]">{date(user.createdAt)}</td>
                    <td className="px-4 py-2">
                      <UserRoleSelect user={user} onRoleChanged={onRoleChanged} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" disabled={isLoadingMore} onClick={() => void loadMore()}>
                {isLoadingMore ? t('common.loading') : t('users.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
