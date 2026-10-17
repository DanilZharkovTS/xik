'use client'

import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { formatRangeLabel } from '@/src/features/reports/report-dates'
import {
  EVENT_TYPES,
  EVENT_TYPE_COLORS,
  EVENT_LABEL_KEYS,
} from '@/src/features/reports/reports.types'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { cn } from '@/src/shared/lib/cn'
import { Segmented } from '@/src/shared/ui/segmented'
import { Skeleton } from '@/src/shared/ui/skeleton'
import { dashboardService } from '../dashboard.service'
import type { ActionItem, Attention, DashboardData, DashboardPeriod } from '../dashboard.service'
import { replyRate } from '@/src/features/reports/reports.types'

// Посилання на зріз контактів: продукт, власник і стан роботи.
const targetsHref = (item: ActionItem, withOwner: boolean): string => {
  const params = new URLSearchParams({ product: item.productId, state: item.followUp > 0 ? 'followUp' : 'needsAnswer' })
  if (withOwner && item.userId) params.set('owner', item.userId)
  return `/outreach/targets?${params.toString()}`
}

function ActionLine({ item, label, href }: { item: ActionItem; label: string; href: string }): ReactElement {
  const { t } = useI18n()
  return (
    <li>
      <Link href={href} className="flex min-h-11 items-center gap-3 rounded-xl px-1 py-1.5 text-sm transition-colors hover:bg-[var(--bg)]">
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        <span className="min-w-0 flex-1">
          <span className="block truncate">{label}</span>
          <span className="block text-xs text-[var(--m)]">
            {item.followUp > 0 && t('dash.action.followUp', { count: item.followUp })}
            {item.followUp > 0 && item.needsAnswer > 0 && ' · '}
            {item.needsAnswer > 0 && t('dash.action.needsAnswer', { count: item.needsAnswer })}
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 text-[var(--m)]" />
      </Link>
    </li>
  )
}

// Менеджер: що зробити сьогодні по його продуктах.
function MyActionsPanel({ actions }: { actions: { followUpDays: number; items: ActionItem[] } }): ReactElement {
  const { t } = useI18n()
  const up = useUrlLocalePath()

  return (
    <Panel title={t('dash.myActions.title')}>
      {actions.items.length === 0 ? (
        <p className="py-1 text-sm text-[var(--m)]">{t('dash.myActions.none')}</p>
      ) : (
        <>
          <p className="mb-1 text-xs text-[var(--m)]">{t('dash.myActions.hint', { days: actions.followUpDays })}</p>
          <ul className="-mx-1 divide-y divide-[var(--l)]">
            {actions.items.map((item) => (
              <ActionLine key={item.productId} item={item} label={item.productName} href={up(targetsHref(item, false))} />
            ))}
          </ul>
        </>
      )}
    </Panel>
  )
}
import { useI18n, useUrlLocalePath } from '@/src/shared/i18n/use-i18n'

function Panel({
  title,
  children,
  vizRoot,
  action,
}: {
  title: string
  children: ReactNode
  vizRoot?: boolean
  action?: ReactNode
}): ReactElement {
  return (
    <section className={`rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:p-4 ${vizRoot ? 'viz-root' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-wider text-[var(--m)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const formatPercent = (rate: number | null): string => (rate === null ? '—' : `${Math.round(rate * 100)}%`)

const TILE_LINK =
  '-m-2 block rounded-xl p-2 transition-colors hover:bg-[var(--bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--t)]'

// Скільки було за весь попередній період. Без стрілок: поточний ще не закінчився,
// тож різниця всередині тижня майже завжди "вниз" і нічого не означає.
function Previous({ period, value }: { period: DashboardPeriod; value: number }): ReactElement {
  const { t } = useI18n()
  return (
    <span className="text-xs text-[var(--m)]">
      {t(period === 'week' ? 'dash.previousWeek' : 'dash.previousMonth', { count: value })}
    </span>
  )
}

function Leaderboard({
  rows,
  hrefFor,
}: {
  rows: { id: string; name: string; total: number }[]
  hrefFor?: (id: string) => string
}): ReactElement {
  const max = Math.max(1, ...rows.map((row) => row.total))

  return (
    <ul className="space-y-1">
      {rows.map((row) => {
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{row.name}</span>
              <span className="font-medium">{row.total}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--l)]">
              <div className="h-full rounded-full bg-[var(--t)]" style={{ width: `${(row.total / max) * 100}%` }} />
            </div>
          </>
        )

        return (
          <li key={row.id}>
            {hrefFor ? (
              <Link href={hrefFor(row.id)} className={cn(TILE_LINK, 'm-0 -mx-2')}>
                {body}
              </Link>
            ) : (
              <div className="py-1">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function AttentionPanel({ attention }: { attention: Attention }): ReactElement {
  const { t } = useI18n()
  const up = useUrlLocalePath()

  const items: { key: string; label: string; href: string; tone: 'warn' | 'info' }[] = []

  if (attention.productsNotInStripe > 0) {
    items.push({
      key: 'stripe',
      label: t('dash.attention.notInStripe', { count: attention.productsNotInStripe }),
      href: up('/admin/products?issue=notInStripe'),
      tone: 'warn',
    })
  }
  for (const moderator of attention.moderatorsWithoutProducts) {
    items.push({
      key: `mod-${moderator.id}`,
      label: t('dash.attention.noProducts', { name: moderator.name }),
      href: up(`/admin/team?assign=${encodeURIComponent(moderator.id)}`),
      tone: 'warn',
    })
  }
  if (attention.scheduledArticles > 0) {
    items.push({
      key: 'scheduled',
      label: t('dash.attention.scheduled', { count: attention.scheduledArticles }),
      href: up('/admin/blog'),
      tone: 'info',
    })
  }
  if (attention.draftArticles > 0) {
    items.push({
      key: 'drafts',
      label: t('dash.attention.drafts', { count: attention.draftArticles }),
      href: up('/admin/blog'),
      tone: 'info',
    })
  }

  return (
    <Panel title={t('dash.attention.title')}>
      {attention.actionItems.length > 0 && (
        <>
          <p className="mb-1 text-xs text-[var(--m)]">{t('dash.myActions.hint', { days: attention.followUpDays })}</p>
          <ul className="-mx-1 mb-1 divide-y divide-[var(--l)] border-b border-[var(--l)]">
            {attention.actionItems.slice(0, 6).map((item) => (
              <ActionLine
                key={`${item.userId}-${item.productId}`}
                item={item}
                label={`${item.name} · ${item.productName}`}
                href={up(targetsHref(item, true))}
              />
            ))}
          </ul>
        </>
      )}
      {items.length === 0 && attention.actionItems.length === 0 ? (
        <p className="py-1 text-sm text-[var(--m)]">{t('dash.attention.none')}</p>
      ) : (
        <ul className="-mx-1 divide-y divide-[var(--l)]">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex min-h-11 items-center gap-3 rounded-xl px-1 text-sm transition-colors hover:bg-[var(--bg)]"
              >
                <span
                  aria-hidden="true"
                  className={cn('h-2 w-2 shrink-0 rounded-full', item.tone === 'warn' ? 'bg-amber-500' : 'bg-sky-500')}
                />
                <span className="flex-1">{item.label}</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-[var(--m)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function DashboardSkeleton({ label }: { label: string }): ReactElement {
  return (
    <div role="status" aria-live="polite" className="space-y-3 md:space-y-6">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  )
}

export function DashboardScreen(): ReactElement {
  const { t } = useI18n()
  const up = useUrlLocalePath()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.accessToken)
  const isAdmin = user?.role === 'admin'
  const canUseJournal = isAdmin || user?.role === 'moderator'

  const [period, setPeriod] = useState<DashboardPeriod>('week')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadedPeriod, setLoadedPeriod] = useState<DashboardPeriod | null>(null)
  const isLoading = loadedPeriod !== period

  useEffect(() => {
    if (!token || !canUseJournal) return

    let isCancelled = false

    dashboardService
      .load(token, isAdmin, period)
      .then((loaded) => {
        if (!isCancelled) setData(loaded)
      })
      .catch((err: unknown) => {
        if (!isCancelled) toast.error(getErrorMessage(err))
      })
      .finally(() => {
        if (!isCancelled) setLoadedPeriod(period)
      })

    return () => {
      isCancelled = true
    }
  }, [token, isAdmin, canUseJournal, period])

  const reportsHref = (extra = '') => up(`/outreach/reports?period=${period}${extra}`)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-3 md:space-y-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium md:text-4xl">
            {t('dash.hi')}
            {user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
            {isAdmin
              ? t(period === 'week' ? 'dash.teamWeek' : 'dash.teamMonth')
              : canUseJournal
                ? t(period === 'week' ? 'dash.myWeek' : 'dash.myMonth')
                : user?.email}
          </p>
        </div>

        {canUseJournal && (
          <Segmented
            label={t('dash.period')}
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'week', label: t('dash.period.week') },
              { value: 'month', label: t('dash.period.month') },
            ]}
            className="w-56"
          />
        )}
      </div>

      {!canUseJournal ? (
        <p className="rounded-2xl border border-[var(--l)] px-4 py-8 text-center text-[var(--m)]">
          {t('dash.noWorkspace')}
        </p>
      ) : !data || (isLoading && !data) ? (
        <DashboardSkeleton label={t('common.loading')} />
      ) : (
        <div className={cn('space-y-3 transition-opacity md:space-y-6', isLoading && 'opacity-60')}>
          <Panel
            vizRoot
            title={`${t(period === 'week' ? 'dash.thisWeek' : 'dash.thisMonth')} · ${formatRangeLabel(period, data.periodLabel.from, data.periodLabel.to)}`}
            action={
              <Link href={reportsHref()} className="text-sm text-[var(--m)] hover:text-[var(--t)]">
                {t('dash.openReports')} →
              </Link>
            }
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {EVENT_TYPES.map((type) => (
                <div key={type}>
                  <Link href={reportsHref()} className={TILE_LINK}>
                    <p className="flex items-center gap-1.5 text-sm text-[var(--m)]">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full"
                        style={{ background: EVENT_TYPE_COLORS[type] }}
                      />
                      {t(EVENT_LABEL_KEYS[type])}
                    </p>
                    <p className="text-3xl font-medium">{data.current[type]}</p>
                    <p>
                      <Previous period={period} value={data.previous[type]} />
                    </p>
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-[var(--l)] pt-3 text-sm text-[var(--m)]">
              {t('dash.replyRate')}{' '}
              <span className="font-medium text-[var(--t)]">{formatPercent(replyRate(data.current.reply, data.current.first))}</span>
              <span className="text-xs">
                {' · '}
                {t(period === 'week' ? 'dash.previousWeek' : 'dash.previousMonth', {
                  count: formatPercent(replyRate(data.previous.reply, data.previous.first)),
                })}
              </span>
            </p>
          </Panel>

          <div className="grid gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {data.myActions && <MyActionsPanel actions={data.myActions} />}
            {data.attention && <AttentionPanel attention={data.attention} />}

            {data.byProduct.length > 0 && (
              <Panel title={t('dash.topProducts')}>
                <Leaderboard
                  rows={data.byProduct}
                  hrefFor={isAdmin ? (id) => reportsHref(`&productId=${encodeURIComponent(id)}`) : undefined}
                />
              </Panel>
            )}

            {data.byModerator.length > 0 && (
              <Panel title={t('dash.topModerators')}>
                <Leaderboard rows={data.byModerator} hrefFor={(id) => reportsHref(`&userId=${encodeURIComponent(id)}`)} />
              </Panel>
            )}

            {data.catalog && (
              <Panel title={t('dash.catalog')}>
                <div className="grid grid-cols-3 gap-3">
                  <Link href={up('/admin/products')} className={TILE_LINK}>
                    <p className="text-sm text-[var(--m)]">{t('dash.active')}</p>
                    <p className="text-3xl font-medium">{data.catalog.total}</p>
                  </Link>
                  <Link href={up('/admin/products?issue=notInStripe')} className={TILE_LINK}>
                    <p className="text-sm text-[var(--m)]">{t('dash.inStripe')}</p>
                    <p className="text-3xl font-medium">
                      {data.catalog.inStripe}
                      <span className="text-base text-[var(--m)]">/{data.catalog.total}</span>
                    </p>
                  </Link>
                  <Link href={up('/admin/products?issue=priceHidden')} className={TILE_LINK}>
                    <p className="text-sm text-[var(--m)]">{t('dash.priceHidden')}</p>
                    <p className="text-3xl font-medium">{data.catalog.hiddenPrice}</p>
                  </Link>
                </div>
              </Panel>
            )}
          </div>

          {data.current.total === 0 && (
            <p className="text-center text-sm text-[var(--m)]">
              {t(period === 'week' ? 'dash.noActivity' : 'dash.noActivityMonth')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
