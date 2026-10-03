'use client'

import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import {
  EVENT_TYPES,
  EVENT_TYPE_COLORS,
  EVENT_LABEL_KEYS,
} from '@/src/features/reports/reports.types'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { dashboardService } from '../dashboard.service'
import type { DashboardData } from '../dashboard.service'
import { useI18n } from '@/src/shared/i18n/use-i18n'

const formatRange = (locale: string, from: string, to: string): string => {
  if (!from || !to) return ''
  const format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return `${format.format(new Date(`${from}T12:00:00Z`))} – ${format.format(new Date(`${to}T12:00:00Z`))}`
}

function Panel({
  title,
  children,
  vizRoot,
}: {
  title: string
  children: ReactNode
  vizRoot?: boolean
}): ReactElement {
  return (
    <section className={`rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:p-4 ${vizRoot ? "viz-root" : ""}`}>
      <h2 className="mb-2 text-xs uppercase tracking-wider text-[var(--m)]">{title}</h2>
      {children}
    </section>
  )
}

function Leaderboard({
  rows,
}: {
  rows: { id: string; name: string; total: number }[]
}): ReactElement {
  const max = Math.max(1, ...rows.map((row) => row.total))

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.name}</span>
            <span className="font-medium">{row.total}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--l)]">
            <div
              className="h-full rounded-full bg-[var(--t)]"
              style={{ width: `${(row.total / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function DashboardScreen(): ReactElement {
  const { t, locale } = useI18n()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.accessToken)
  const isAdmin = user?.role === 'admin'
  const canUseJournal = isAdmin || user?.role === 'moderator'

  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token || !canUseJournal) return

    let isCancelled = false

    dashboardService
      .load(token, isAdmin)
      .then((loaded) => {
        if (!isCancelled) setData(loaded)
      })
      .catch((err: unknown) => {
        if (!isCancelled) toast.error(getErrorMessage(err))
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [token, isAdmin, canUseJournal])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-3 md:space-y-6 md:py-10">
      <div>
        <h1 className="text-2xl font-medium md:text-4xl">
          {t('dash.hi')}{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
          {isAdmin ? t('dash.teamWeek') : canUseJournal ? t('dash.myWeek') : user?.email}
        </p>
      </div>

      {!canUseJournal ? (
        <p className="rounded-2xl border border-[var(--l)] px-4 py-8 text-center text-[var(--m)]">
          {t('dash.noWorkspace')}
        </p>
      ) : isLoading || !data ? (
        <p className="py-12 text-center text-[var(--m)]">{t('common.loading')}</p>
      ) : (
        <>
          <Panel vizRoot title={`${t('dash.thisWeek')} · ${formatRange(locale, data.periodLabel.from, data.periodLabel.to)}`}>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {EVENT_TYPES.map((type) => (
                <div key={type}>
                  <dt className="flex items-center gap-1.5 text-sm text-[var(--m)]">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{ background: EVENT_TYPE_COLORS[type] }}
                    />
                    {t(EVENT_LABEL_KEYS[type])}
                  </dt>
                  <dd className="text-3xl font-medium">{data.week[type]}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <div className="grid gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {data.byProduct.length > 0 && (
              <Panel title={t('dash.topProducts')}>
                <Leaderboard rows={data.byProduct} />
              </Panel>
            )}

            {data.byModerator.length > 0 && (
              <Panel title={t('dash.topModerators')}>
                <Leaderboard rows={data.byModerator} />
              </Panel>
            )}

            {data.catalog && (
              <Panel title={t('dash.catalog')}>
                <dl className="grid grid-cols-3 gap-3">
                  <div>
                    <dt className="text-sm text-[var(--m)]">{t('dash.active')}</dt>
                    <dd className="text-3xl font-medium">{data.catalog.total}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[var(--m)]">{t('dash.inStripe')}</dt>
                    <dd className="text-3xl font-medium">
                      {data.catalog.inStripe}
                      <span className="text-base text-[var(--m)]">/{data.catalog.total}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-[var(--m)]">{t('dash.priceHidden')}</dt>
                    <dd className="text-3xl font-medium">{data.catalog.hiddenPrice}</dd>
                  </div>
                </dl>
              </Panel>
            )}
          </div>

          {data.week.total === 0 && (
            <p className="text-center text-sm text-[var(--m)]">
              {t('dash.noActivity')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
