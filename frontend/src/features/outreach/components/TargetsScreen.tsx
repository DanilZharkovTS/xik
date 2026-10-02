'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import Link from 'next/link'

import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { formatDateTime, formatRelative } from '../format-date'
import { outreachService } from '../outreach.service'
import type { TargetListItem } from '../outreach.types'
import { useOutreachContext } from '../use-outreach-context'
import { IdentifierLink } from './IdentifierLink'

export function TargetsScreen(): ReactElement {
  const { token, productId, handleError } = useOutreachContext()

  const [targets, setTargets] = useState<TargetListItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    if (!token || !productId) return

    let isCancelled = false

    outreachService
      .listTargets(token, productId)
      .then((page) => {
        if (isCancelled) return
        setTargets(page.targets)
        setNextCursor(page.nextCursor)
        setIsLoading(false)
      })
      .catch(async (err: unknown) => {
        if (isCancelled) return
        setIsLoading(false)
        await handleError(err)
      })

    return () => {
      isCancelled = true
    }
  }, [token, productId, handleError])

  const loadMore = useCallback(async () => {
    if (!token || !productId || !nextCursor) return

    try {
      setIsLoadingMore(true)
      const page = await outreachService.listTargets(token, productId, nextCursor)
      setTargets((current) => [...current, ...page.targets])
      setNextCursor(page.nextCursor)
    } catch (err) {
      await handleError(err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [token, productId, nextCursor, handleError])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-medium">My targets</h1>
        <p className="mt-1 text-[var(--m)]">
          People and companies you have written to in this product.
        </p>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-[var(--m)]">Loading...</p>
      ) : targets.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">Nothing here yet</p>
          <p className="mt-1 text-sm text-[var(--m)]">
            Check a contact and register your first message.
          </p>
          <Link
            href="/outreach/check"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--t)] px-5 font-medium text-[var(--bg)]"
          >
            Go to Check
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {targets.map((target) => (
              <li
                key={target.id}
                className={cn(
                  'space-y-3 rounded-2xl border bg-[var(--s)] p-4',
                  target.status === 'do_not_contact'
                    ? 'border-red-500/60'
                    : 'border-[var(--l)]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-lg font-medium">{target.displayName}</p>
                    <p className="text-sm text-[var(--m)]">
                      {target.owner.name} · last contact{' '}
                      <span title={formatDateTime(target.lastContactedAt)}>
                        {formatRelative(target.lastContactedAt)}
                      </span>
                    </p>
                  </div>

                  {target.status === 'do_not_contact' && (
                    <span className="shrink-0 rounded-full border border-red-500/60 px-2.5 py-0.5 text-xs font-medium">
                      Do not contact
                    </span>
                  )}
                </div>

                <ul className="flex flex-wrap gap-2">
                  {target.identifiers.map((identifier) => (
                    <li key={`${identifier.channel}:${identifier.value}`} className="max-w-full">
                      <IdentifierLink {...identifier} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          {nextCursor && (
            <Button
              variant="secondary"
              className="w-full"
              disabled={isLoadingMore}
              onClick={loadMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
