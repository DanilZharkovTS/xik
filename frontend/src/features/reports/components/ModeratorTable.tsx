'use client'

import type { ReactElement } from 'react'

import type { ModeratorActivity } from '@/src/features/team/team.types'
import type { OwnerSummary } from '@/src/features/outreach/outreach.types'
import { cn } from '@/src/shared/lib/cn'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { formatRelative } from '@/src/features/outreach/format-date'
import { replyRate } from '../reports.types'
import type { NamedRow } from '../reports.types'

export const formatRate = (rate: number | null): string => (rate === null ? '—' : `${Math.round(rate * 100)}%`)

type ModeratorTableProps = {
  rows: NamedRow[]
  // Модератори без подій у періоді теж мають бути видні: саме вони й потребують уваги.
  moderators: { id: string; name: string; activity?: ModeratorActivity }[]
  followUps: OwnerSummary[]
  followUpDays: number
  selectedId: string
  onSelect: (id: string) => void
}

// Порівняння менеджерів за період: обсяг, якість (частка відповідей) і що висить без руху.
export function ModeratorTable({
  rows,
  moderators,
  followUps,
  followUpDays,
  selectedId,
  onSelect,
}: ModeratorTableProps): ReactElement {
  const { t } = useI18n()

  const byId = new Map(rows.map((row) => [row.id, row]))
  const followUpById = new Map(followUps.map((row) => [row.userId, row]))
  const ids = new Set([...rows.map((row) => row.id), ...moderators.map((moderator) => moderator.id)])
  const nameOf = (id: string) => byId.get(id)?.name ?? moderators.find((moderator) => moderator.id === id)?.name ?? '—'
  const lastActivity = (id: string) => moderators.find((moderator) => moderator.id === id)?.activity?.lastEventAt ?? null

  const table = [...ids]
    .map((id) => {
      const counts = byId.get(id)
      return {
        id,
        name: nameOf(id),
        first: counts?.first ?? 0,
        repeat: counts?.repeat ?? 0,
        reply: counts?.reply ?? 0,
        publication: counts?.publication ?? 0,
        total: counts?.total ?? 0,
        rate: replyRate(counts?.reply ?? 0, counts?.first ?? 0),
        followUp: followUpById.get(id)?.followUp ?? 0,
        needsAnswer: followUpById.get(id)?.needsAnswer ?? 0,
        lastEventAt: lastActivity(id),
      }
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

  const header = 'px-3 py-2.5 text-right font-medium first:text-left'
  const cell = 'px-3 py-2.5 text-right tabular-nums first:text-left'

  return (
    <section className="viz-root rounded-2xl border border-[var(--l)] bg-[var(--viz-surface)] p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-medium text-[var(--viz-text)]">{t('reports.byModerator')}</h2>
        <p className="text-xs text-[var(--viz-muted)]">{t('reports.mod.hint')}</p>
      </div>

      {table.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--viz-muted)]">{t('reports.noActivity')}</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--viz-muted)]">
              <tr className="border-b border-[var(--l)]">
                <th scope="col" className={header}>{t('reports.mod.name')}</th>
                <th scope="col" className={header}>{t('reports.mod.first')}</th>
                <th scope="col" className={header}>{t('reports.mod.repeat')}</th>
                <th scope="col" className={header}>{t('reports.mod.reply')}</th>
                <th scope="col" className={header} title={t('reports.mod.rateHint')}>{t('reports.mod.rate')}</th>
                <th scope="col" className={header}>{t('reports.mod.publication')}</th>
                <th scope="col" className={header} title={t('reports.mod.followUpHint', { days: followUpDays })}>
                  {t('reports.mod.followUp', { days: followUpDays })}
                </th>
                <th scope="col" className={header}>{t('reports.mod.lastActivity')}</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-[var(--l)] last:border-0',
                    selectedId === row.id && 'bg-[var(--bg)]',
                  )}
                >
                  <td className={cell}>
                    <button
                      type="button"
                      onClick={() => onSelect(selectedId === row.id ? '' : row.id)}
                      aria-pressed={selectedId === row.id}
                      className="text-left font-medium text-[var(--viz-text)] underline-offset-4 hover:underline"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className={cell}>{row.first}</td>
                  <td className={cell}>{row.repeat}</td>
                  <td className={cell}>{row.reply}</td>
                  <td className={cn(cell, 'font-medium')}>{formatRate(row.rate)}</td>
                  <td className={cell}>{row.publication}</td>
                  <td className={cn(cell, row.followUp > 0 && 'font-medium text-amber-600')}>
                    {row.followUp}
                    {row.needsAnswer > 0 && (
                      <span className="ml-1 text-xs font-normal text-sky-600" title={t('reports.mod.needsAnswerHint')}>
                        +{row.needsAnswer}
                      </span>
                    )}
                  </td>
                  <td className={cn(cell, 'whitespace-nowrap text-[var(--viz-muted)]')}>
                    {row.lastEventAt ? formatRelative(row.lastEventAt) : t('team.activity.never')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// Шаблони: який текст частіше дає відповідь.
export function TemplateTable({ rows }: { rows: { id: string; title: string; uses: number; targets: number; replied: number }[] }): ReactElement {
  const { t } = useI18n()
  const header = 'px-3 py-2.5 text-right font-medium first:text-left'
  const cell = 'px-3 py-2.5 text-right tabular-nums first:text-left'

  return (
    <section className="viz-root rounded-2xl border border-[var(--l)] bg-[var(--viz-surface)] p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-medium text-[var(--viz-text)]">{t('reports.byTemplate')}</h2>
        <p className="text-xs text-[var(--viz-muted)]">{t('reports.tpl.hint')}</p>
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--viz-muted)]">{t('reports.tpl.none')}</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[30rem] text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--viz-muted)]">
              <tr className="border-b border-[var(--l)]">
                <th scope="col" className={header}>{t('reports.tpl.title')}</th>
                <th scope="col" className={header}>{t('reports.tpl.uses')}</th>
                <th scope="col" className={header}>{t('reports.tpl.people')}</th>
                <th scope="col" className={header}>{t('reports.tpl.replied')}</th>
                <th scope="col" className={header}>{t('reports.mod.rate')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--l)] last:border-0">
                  <td className={cn(cell, 'max-w-[16rem] truncate font-medium text-[var(--viz-text)]')}>{row.title}</td>
                  <td className={cell}>{row.uses}</td>
                  <td className={cell}>{row.targets}</td>
                  <td className={cell}>{row.replied}</td>
                  <td className={cn(cell, 'font-medium')}>{formatRate(row.targets > 0 ? row.replied / row.targets : null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
