'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import Link from 'next/link'
import { Download, Search } from 'lucide-react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { Picker } from '@/src/shared/ui/picker'
import { RowsSkeleton } from '@/src/shared/ui/skeleton'
import { formatDateTime, formatRelative } from '../format-date'
import { outreachService } from '../outreach.service'
import { CHANNELS, TARGET_STATES, channelLabel } from '../outreach.types'
import type {
  Channel,
  TargetDetail,
  TargetFilters,
  TargetListItem,
  TargetState,
  TargetsSummary,
} from '../outreach.types'
import { useOutreachContext } from '../use-outreach-context'
import { IdentifierLink } from './IdentifierLink'
import { TargetActions } from './TargetActions'
import { TargetDetailCard } from './TargetDetailCard'
import { useI18n, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'

const DAY_MS = 24 * 60 * 60 * 1000

const isState = (value: string | null): value is TargetState =>
  value !== null && (TARGET_STATES as readonly string[]).includes(value)

// Що відбувається з контактом зараз: одна позначка замість розбору історії.
function StateBadge({ target, followUpDays, now }: { target: TargetListItem; followUpDays: number; now: number }): ReactElement | null {
  const { t } = useI18n()

  if (target.status === 'do_not_contact') {
    return (
      <span className="shrink-0 rounded-full border border-red-500/60 px-2.5 py-0.5 text-xs font-medium">
        {t('targets.doNotContact')}
      </span>
    )
  }

  const lastReply = target.lastReplyAt ? new Date(target.lastReplyAt).getTime() : null
  const lastContact = target.lastContactedAt ? new Date(target.lastContactedAt).getTime() : null

  if (lastReply !== null && (lastContact === null || lastReply >= lastContact)) {
    return (
      <span className="shrink-0 rounded-full border border-sky-500/50 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-600">
        {t('targets.state.needsAnswerBadge')}
      </span>
    )
  }
  if (lastReply !== null) {
    return (
      <span className="shrink-0 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
        {t('targets.state.repliedBadge')}
      </span>
    )
  }
  if (lastContact !== null && now - lastContact > followUpDays * DAY_MS) {
    return (
      <span className="shrink-0 rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
        {t('targets.state.followUpBadge', { days: Math.floor((now - lastContact) / DAY_MS) })}
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full border border-[var(--l)] px-2.5 py-0.5 text-xs font-medium text-[var(--m)]">
      {t('targets.state.awaitingBadge')}
    </span>
  )
}

export function TargetsScreen(): ReactElement {
  const { t } = useI18n()
  const up = useUrlLocalePath()
  const { token, productId, handleError } = useOutreachContext()
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')

  const [filters, setFilters] = useState<TargetFilters>({ state: 'all' })
  const [search, setSearch] = useState('')
  const [summary, setSummary] = useState<TargetsSummary | null>(null)
  const [targets, setTargets] = useState<TargetListItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [details, setDetails] = useState<Record<string, TargetDetail>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)
  // Опорний час для позначок "N дн. без відповіді": фіксується при відкритті екрана.
  const [now] = useState(() => Date.now())

  // Посилання з дашборду: ?state=followUp&owner=<id> відкриває потрібний зріз.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const state = params.get('state')
    const owner = params.get('owner')
    if (!isState(state) && !owner) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- фільтр із посилання застосовується один раз
    setFilters((current) => ({
      ...current,
      ...(isState(state) ? { state } : {}),
      ...(owner ? { ownerUserId: owner } : {}),
    }))
  }, [])

  // Пошук із паузою, щоб не слати запит на кожну літеру.
  useEffect(() => {
    const timer = setTimeout(() => setFilters((current) => ({ ...current, q: search.trim() || undefined })), 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadSummary = useCallback(async () => {
    if (!token || !productId) return
    try {
      setSummary(await outreachService.summary(token, productId))
    } catch {
      // лічильники не критичні: список працює й без них
    }
  }, [token, productId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- лічильники при зміні продукту
    void loadSummary()
  }, [loadSummary])

  const key = JSON.stringify({ productId, filters })
  const isLoading = loadedKey !== key

  useEffect(() => {
    if (!token || !productId) return

    let isCancelled = false

    outreachService
      .listTargets(token, productId, filters)
      .then((page) => {
        if (isCancelled) return
        setTargets(page.targets)
        setNextCursor(page.nextCursor)
      })
      .catch(async (err: unknown) => {
        if (!isCancelled) await handleError(err)
      })
      .finally(() => {
        if (!isCancelled) setLoadedKey(key)
      })

    return () => {
      isCancelled = true
    }
  }, [token, productId, filters, key, handleError])

  const loadMore = useCallback(async () => {
    if (!token || !productId || !nextCursor) return

    try {
      setIsLoadingMore(true)
      const page = await outreachService.listTargets(token, productId, filters, nextCursor)
      setTargets((current) => [...current, ...page.targets])
      setNextCursor(page.nextCursor)
    } catch (err) {
      await handleError(err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [token, productId, filters, nextCursor, handleError])

  const exportCsv = async () => {
    if (!token || !productId) return
    try {
      setIsExporting(true)
      const { truncated } = await outreachService.exportTargets(token, productId, filters)
      toast.success(truncated ? t('targets.export.truncated') : t('targets.export.done'))
    } catch (err) {
      await handleError(err)
    } finally {
      setIsExporting(false)
    }
  }

  const toggleDetails = async (id: string) => {
    if (openId === id) {
      setOpenId(null)
      return
    }

    setOpenId(id)
    if (details[id] || !token || !productId) return

    try {
      setLoadingDetailId(id)
      const detail = await outreachService.getTarget(id, token, productId)
      setDetails((current) => ({ ...current, [id]: detail }))
    } catch (err) {
      setOpenId(null)
      await handleError(err)
    } finally {
      setLoadingDetailId(null)
    }
  }

  // Після дії оновлюємо і картку, і рядок списку (статус, останній контакт, відповідь), і лічильники.
  const applyUpdate = (updated: TargetDetail) => {
    setDetails((current) => ({ ...current, [updated.id]: updated }))
    setTargets((current) =>
      current.map((item) =>
        item.id === updated.id
          ? {
              ...item,
              status: updated.status,
              lastContactedAt: updated.lastContactedAt,
              lastReplyAt: updated.lastReplyAt,
              identifiers: updated.identifiers,
            }
          : item,
      ),
    )
    void loadSummary()
  }

  const followUpDays = summary?.followUpDays ?? 3
  const counts = summary?.totals
  const countFor = (state: TargetState): number | undefined => {
    if (!counts) return undefined
    return state === 'all' ? counts.total : counts[state]
  }

  const hasFilters = filters.state !== 'all' || Boolean(filters.ownerUserId || filters.channel || filters.q)

  return (
    <div className="space-y-3 md:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium md:text-4xl">{isAdmin ? t('targets.titleAdmin') : t('targets.title')}</h1>
          <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
            {isAdmin ? t('targets.introAdmin') : t('targets.intro')}
          </p>
        </div>
        <Button variant="secondary" disabled={isExporting || !token} onClick={() => void exportCsv()}>
          <Download aria-hidden="true" className="mr-2 h-4 w-4" />
          {isExporting ? t('common.loading') : t('targets.export')}
        </Button>
      </div>

      <div
        role="tablist"
        aria-label={t('targets.stateFilter')}
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
      >
        {TARGET_STATES.map((state) => {
          const count = countFor(state)
          const isActive = filters.state === state
          const isUrgent = (state === 'followUp' || state === 'needsAnswer') && (count ?? 0) > 0
          return (
            <button
              key={state}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilters((current) => ({ ...current, state }))}
              className={cn(
                'inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-[var(--t)] bg-[var(--t)] text-[var(--bg)]'
                  : 'border-[var(--l)] text-[var(--m)] hover:text-[var(--t)]',
              )}
            >
              {t(`targets.state.${state}`, { days: followUpDays })}
              {count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs',
                    isActive ? 'bg-[var(--bg)] text-[var(--t)]' : isUrgent ? 'bg-amber-500/15 text-amber-600' : 'bg-[var(--s)]',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_12rem_14rem] md:gap-3">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--m)]"
          />
          <input
            type="search"
            aria-label={t('targets.search')}
            placeholder={t('targets.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-h-11 w-full rounded-full border border-[var(--l)] bg-[var(--bg)] pl-10 pr-4 text-base outline-none focus:border-[var(--t)]"
          />
        </div>

        <Picker
          label={t('targets.channel')}
          hideLabel
          pill
          value={filters.channel ?? ''}
          onChange={(value) => setFilters((current) => ({ ...current, channel: (value || undefined) as Channel | undefined }))}
          options={[
            { value: '', label: t('targets.allChannels') },
            ...CHANNELS.map((channel) => ({ value: channel, label: channelLabel(channel) })),
          ]}
        />

        {isAdmin && (
          <Picker
            label={t('targets.owner')}
            hideLabel
            pill
            value={filters.ownerUserId ?? ''}
            onChange={(value) => setFilters((current) => ({ ...current, ownerUserId: value || undefined }))}
            options={[
              { value: '', label: t('targets.allOwners') },
              ...(summary?.byOwner ?? []).map((owner) => ({ value: owner.userId, label: `${owner.name} · ${owner.total}` })),
            ]}
          />
        )}
      </div>

      {isLoading ? (
        <RowsSkeleton rows={5} label={t('common.loading')} />
      ) : targets.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">{hasFilters ? t('targets.noMatches') : t('targets.emptyTitle')}</p>
          <p className="mt-1 text-sm text-[var(--m)]">
            {hasFilters ? t('targets.noMatchesHint') : t('targets.emptyText')}
          </p>
          {!hasFilters && (
            <Link
              href={up('/outreach/check')}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--t)] px-5 font-medium text-[var(--bg)]"
            >
              {t('targets.goCheck')}
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {targets.map((target) => (
              <li
                key={target.id}
                className={cn(
                  'space-y-3 rounded-2xl border bg-[var(--s)] p-4',
                  target.status === 'do_not_contact' ? 'border-red-500/60' : 'border-[var(--l)]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-lg font-medium">{target.displayName}</p>
                    <p className="text-sm text-[var(--m)]">
                      {isAdmin && `${target.owner.name} · `}
                      {t('targets.lastContact')}{' '}
                      <span title={formatDateTime(target.lastContactedAt)}>{formatRelative(target.lastContactedAt)}</span>
                      {target.lastReplyAt && (
                        <>
                          {' · '}
                          {t('targets.lastReply')}{' '}
                          <span title={formatDateTime(target.lastReplyAt)}>{formatRelative(target.lastReplyAt)}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <StateBadge target={target} followUpDays={followUpDays} now={now} />
                </div>

                <ul className="flex flex-wrap gap-2">
                  {target.identifiers.map((identifier) => (
                    <li key={`${identifier.channel}:${identifier.value}`} className="max-w-full">
                      <IdentifierLink {...identifier} />
                    </li>
                  ))}
                </ul>

                <Button
                  variant="secondary"
                  className="w-full"
                  aria-expanded={openId === target.id}
                  onClick={() => toggleDetails(target.id)}
                >
                  {openId === target.id ? t('targets.hide') : t('targets.details')}
                </Button>

                {openId === target.id &&
                  (details[target.id] ? (
                    <div className="space-y-4 border-t border-[var(--l)] pt-4">
                      <TargetDetailCard target={details[target.id]} />
                      {token && productId && (
                        <TargetActions
                          target={details[target.id]}
                          token={token}
                          productId={productId}
                          onUpdated={applyUpdate}
                          onError={handleError}
                        />
                      )}
                    </div>
                  ) : (
                    loadingDetailId === target.id && (
                      <p className="py-4 text-center text-[var(--m)]">{t('common.loading')}</p>
                    )
                  ))}
              </li>
            ))}
          </ul>

          {nextCursor && (
            <Button variant="secondary" className="w-full" disabled={isLoadingMore} onClick={loadMore}>
              {isLoadingMore ? t('common.loading') : t('targets.loadMore')}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
