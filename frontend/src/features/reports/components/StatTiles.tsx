import type { ReactElement } from 'react'

import { EVENT_LABEL_KEYS, EVENT_TYPE_COLORS } from '../reports.types'
import type { EventType, ReportCounts } from '../reports.types'
import { useI18n } from '@/src/shared/i18n/use-i18n'

type StatTilesProps = {
  totals: ReportCounts
  types: EventType[]
}

// Одне головне число (звернення) і плитки решти. Звернення це нові й повторні; відповіді та
// публікації рахуються окремо.
export function StatTiles({ totals, types }: StatTilesProps): ReactElement {
  const { t } = useI18n()

  return (
    <section className="viz-root space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--viz-surface)] p-4">
      <div>
        <p className="text-sm text-[var(--viz-text-2)]">{t('reports.contacts')}</p>
        <p className="text-5xl font-semibold leading-tight text-[var(--viz-text)] md:text-6xl">
          {totals.contacts.toLocaleString()}
        </p>
        <p className="text-sm text-[var(--viz-muted)]">{t('reports.contactsHint')}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 border-t border-[var(--viz-grid)] pt-3 sm:grid-cols-4">
        {types.map((type) => (
          <div key={type}>
            <dt className="flex items-center gap-2 text-sm text-[var(--viz-text-2)]">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: EVENT_TYPE_COLORS[type] }}
              />
              {t(EVENT_LABEL_KEYS[type])}
            </dt>
            <dd className="text-2xl font-semibold text-[var(--viz-text)]">
              {totals[type].toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
