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

export const UsersList = () => {
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
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:py-10">
      <div>
        <h1 className="text-3xl font-medium md:text-4xl">Users</h1>
        <p className="mt-1 text-[var(--m)]">Everyone with an account and their role.</p>
      </div>

      <UserSearch search={search || ''} />

      {loading ? (
        <p className="py-12 text-center text-[var(--m)]">Loading...</p>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">No users found</p>
          <p className="mt-1 text-sm text-[var(--m)]">Try changing your search.</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </ul>
      )}
    </div>
  )
}
