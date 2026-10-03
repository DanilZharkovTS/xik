'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { useOutreachContext } from '@/src/features/outreach/use-outreach-context'
import { useOutreachStore } from '@/src/features/outreach/outreach-store'
import { teamService } from '@/src/features/team/team.service'
import type { Moderator } from '@/src/features/team/team.types'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { channelLabel } from '../channel-label'
import { formatRangeLabel, shiftAnchor } from '../report-dates'
import { reportsService } from '../reports.service'
import { EVENT_TYPES } from '../reports.types'
import type { EventType, Period, Report, ReportQuery } from '../reports.types'
import { ActivityChart } from './ActivityChart'
import { BreakdownList } from './BreakdownList'
import { ALL_PRODUCTS, ReportFilters } from './ReportFilters'
import { StatTiles } from './StatTiles'
import { useI18n } from '@/src/shared/i18n/use-i18n'

export function ReportsScreen(): ReactElement {
  const { t } = useI18n()
  const { token, productId, handleError } = useOutreachContext()
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin')
  const products = useOutreachStore((state) => state.products)

  const [period, setPeriod] = useState<Period>('week')
  // null означає "сьогодні" за часовим поясом сервера; далі зсуваємо від початку показаного періоду.
  const [anchor, setAnchor] = useState<string | null>(null)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [types, setTypes] = useState<EventType[]>([...EVENT_TYPES])
  const [scope, setScope] = useState<string>(ALL_PRODUCTS)
  const [userId, setUserId] = useState('')
  const [moderators, setModerators] = useState<Moderator[]>([])

  const [report, setReport] = useState<Report | null>(null)
  const [settledKey, setSettledKey] = useState('')

  const isCustomReady = period !== 'custom' || (customFrom !== '' && customTo !== '')

  const query = useMemo<ReportQuery | null>(() => {
    if (!isCustomReady) return null

    return {
      period,
      date: period === 'custom' ? undefined : (anchor ?? undefined),
      from: period === 'custom' ? customFrom : undefined,
      to: period === 'custom' ? customTo : undefined,
      types,
      userId: isAdmin && userId ? userId : undefined,
      productId: isAdmin && scope !== ALL_PRODUCTS ? scope : undefined,
    }
  }, [isCustomReady, period, anchor, customFrom, customTo, types, isAdmin, userId, scope])

  // Ключ запиту: поки він не збігається з останнім завершеним, показуємо попередній звіт приглушеним.
  const key = JSON.stringify({ query, productId, isAdmin })
  const isLoading = query !== null && settledKey !== key

  useEffect(() => {
    if (!token || !query) return
    if (!isAdmin && !productId) return

    let isCancelled = false

    const request = isAdmin
      ? reportsService.forAdmin(query, token)
      : reportsService.forProduct(query, token, productId!)

    request
      .then((loaded) => {
        if (isCancelled) return
        setReport(loaded)
        setSettledKey(key)
      })
      .catch(async (err: unknown) => {
        if (isCancelled) return
        setSettledKey(key)
        await handleError(err)
      })

    return () => {
      isCancelled = true
    }
  }, [token, query, key, isAdmin, productId, handleError])

  useEffect(() => {
    if (!token || !isAdmin) return

    let isCancelled = false

    teamService
      .listModerators(token)
      .then((loaded) => {
        if (!isCancelled) setModerators(loaded)
      })
      .catch((err: unknown) => {
        if (!isCancelled) toast.error(getErrorMessage(err))
      })

    return () => {
      isCancelled = true
    }
  }, [token, isAdmin])

  // Опорна дата не змінюється: з "цього тижня" на "місяць" потрапляємо в поточний місяць,
  // а не в той, де почався тиждень.
  const changePeriod = (next: Period) => setPeriod(next)

  const shift = (direction: -1 | 1) => {
    if (!report) return
    setAnchor(shiftAnchor(period, report.range.from, direction))
  }

  const toggleType = (type: EventType) => {
    setTypes((current) => {
      if (!current.includes(type)) return EVENT_TYPES.filter((item) => item === type || current.includes(item))
      // Хоча б один тип має лишатися, інакше звіт порожній за визначенням.
      return current.length > 1 ? current.filter((item) => item !== type) : current
    })
  }

  const visibleTypes = EVENT_TYPES.filter((type) => types.includes(type))

  return (
    <div className="space-y-3 md:space-y-5">
      <div>
        <h1 className="text-2xl font-medium md:text-4xl">{t('reports.title')}</h1>
        <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
          {isAdmin
            ? t('reports.introAdmin')
            : t('reports.introMod')}
        </p>
      </div>

      <ReportFilters
        period={period}
        onPeriod={changePeriod}
        rangeLabel={report ? formatRangeLabel(period, report.range.from, report.range.to) : '...'}
        onShift={shift}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFrom={setCustomFrom}
        onCustomTo={setCustomTo}
        types={types}
        onToggleType={toggleType}
        admin={
          isAdmin
            ? {
                scope,
                onScope: setScope,
                products,
                userId,
                onUser: setUserId,
                moderators: moderators.map(({ id, name }) => ({ id, name })),
              }
            : undefined
        }
      />

      {!report ? (
        <p className="py-12 text-center text-[var(--m)]">
          {isCustomReady ? t('common.loading') : t('reports.chooseDates')}
        </p>
      ) : (
        <div className={isLoading ? 'space-y-5 opacity-60 transition-opacity' : 'space-y-5 transition-opacity'}>
          <StatTiles totals={report.totals} types={visibleTypes} />

          <section className="viz-root rounded-2xl border border-[var(--l)] bg-[var(--viz-surface)] p-4">
            <h2 className="mb-3 text-base font-medium text-[var(--viz-text)]">
              {report.range.granularity === 'month' ? t('reports.byMonth') : t('reports.byDay')}
            </h2>
            <ActivityChart report={report} types={visibleTypes} />
          </section>

          <BreakdownList
            title={t('reports.byChannel')}
            rows={report.byChannel.map((row) => ({
              key: row.channel,
              label: channelLabel(row.channel),
              value: row.total,
            }))}
          />

          {report.byModerator && (
            <BreakdownList
              title={t('reports.byModerator')}
              rows={report.byModerator.map((row) => ({ key: row.id, label: row.name, value: row.total }))}
            />
          )}

          {report.byProduct && (
            <BreakdownList
              title={t('reports.byProduct')}
              rows={report.byProduct.map((row) => ({ key: row.id, label: row.name, value: row.total }))}
            />
          )}
        </div>
      )}
    </div>
  )
}
