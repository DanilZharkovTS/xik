'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { userService } from '../user.service'
import useAuthStore from '../../auth/store'
import { User } from '../user.types'
import { UserSearch } from './UserSearch'
import { UserCard } from './UserCard'

import { SectionReveal } from '@/src/shared/motion/section-reveal'
import { PageContainer } from '@/src/shared/ui/pixel/page-container'
import { PixelHeading } from '@/src/shared/ui/pixel/pixel-heading'

export const UsersList = () => {
  const query = useSearchParams()
  const search = query.get('search')

  const token = useAuthStore((state) => state.accessToken)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return

    const findUsers = async () => {
      try {
        setLoading(true)

        const res = await userService.findUsers(search, token)

        setUsers(res.users)
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message)
        }

        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    findUsers()
  }, [token, search])

  return (
    <main className="border-b-pixel border-border">
      <PageContainer className="py-10 md:py-14">
        <SectionReveal>
          <div className="space-y-8">
            <div className="flex flex-col gap-6 border-b-pixel border-border pb-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground-muted">
                  {"// network.directory"}
                </p>

                <PixelHeading as="h1" size="page">
                  Users
                </PixelHeading>

                <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground-muted md:text-lg">
                  Discover users and explore the people connected to the
                  network.
                </p>
              </div>

              <div className="shrink-0 border-pixel border-border px-4 py-3 font-mono text-sm">
                <span className="text-foreground-muted">RESULTS:</span>{' '}
                <span>{users.length.toString().padStart(2, '0')}</span>
              </div>
            </div>

            <UserSearch search={search || ''} />

            <div className="border-pixel border-border">
              <div className="flex items-center justify-between border-b-pixel border-border px-4 py-3 font-mono text-xs uppercase tracking-wider text-foreground-muted">
                <span>Directory</span>

                <span>
                  {loading ? 'Scanning...' : `${users.length} records`}
                </span>
              </div>

              {loading ? (
                <div className="flex min-h-48 items-center justify-center px-6 py-12">
                  <p className="font-mono text-sm uppercase tracking-wider text-foreground-muted">
                    Loading users...
                  </p>
                </div>
              ) : users.length > 0 ? (
                <div className="flex flex-col">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center px-6 py-12 text-center">
                  <p className="font-mono text-sm uppercase tracking-wider">
                    No users found
                  </p>

                  <p className="mt-2 text-sm text-foreground-muted">
                    Try changing your search query.
                  </p>
                </div>
              )}
            </div>
          </div>
        </SectionReveal>
      </PageContainer>
    </main>
  )
}