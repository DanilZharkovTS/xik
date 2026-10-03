'use client'

import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { SelectField } from '@/src/shared/ui/select-field'
import { TextField } from '@/src/shared/ui/text-field'
import {
  EVENT_TYPES,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  PERIODS,
  PERIOD_LABELS,
} from '../reports.types'
import type { EventType, Period } from '../reports.types'

export const ALL_PRODUCTS = 'all'

type ReportFiltersProps = {
  period: Period
  onPeriod: (period: Period) => void
  rangeLabel: string
  onShift: (direction: -1 | 1) => void
  customFrom: string
  customTo: string
  onCustomFrom: (value: string) => void
  onCustomTo: (value: string) => void
  types: EventType[]
  onToggleType: (type: EventType) => void
  // Лише для адміна.
  admin?: {
    scope: string
    onScope: (scope: string) => void
    products: { id: string; name: string }[]
    userId: string
    onUser: (userId: string) => void
    moderators: { id: string; name: string }[]
  }
}

// Усі фільтри в одному блоці над вмістом: вони звужують усе, що нижче, тож числа завжди збігаються.
export function ReportFilters({
  period,
  onPeriod,
  rangeLabel,
  onShift,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  types,
  onToggleType,
  admin,
}: ReportFiltersProps): ReactElement {
  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Period"
        className="grid grid-cols-5 rounded-full border border-[var(--l)] p-1"
      >
        {PERIODS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={period === item}
            onClick={() => onPeriod(item)}
            className={cn(
              'min-h-10 rounded-full px-1 text-sm font-medium',
              period === item ? 'bg-[var(--t)] text-[var(--bg)]' : 'text-[var(--m)]',
            )}
          >
            {PERIOD_LABELS[item]}
          </button>
        ))}
      </div>

      {period === 'custom' ? (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="From"
            type="date"
            value={customFrom}
            max={customTo || undefined}
            onChange={(event) => onCustomFrom(event.target.value)}
          />
          <TextField
            label="To"
            type="date"
            value={customTo}
            min={customFrom || undefined}
            onChange={(event) => onCustomTo(event.target.value)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" aria-label="Previous period" className="w-12 px-0" onClick={() => onShift(-1)}>
            ‹
          </Button>
          <p className="min-w-0 flex-1 text-center text-base font-medium">{rangeLabel}</p>
          <Button variant="secondary" aria-label="Next period" className="w-12 px-0" onClick={() => onShift(1)}>
            ›
          </Button>
        </div>
      )}

      <div role="group" aria-label="Event types" className="flex flex-wrap gap-2">
        {EVENT_TYPES.map((type) => {
          const isOn = types.includes(type)

          return (
            <button
              key={type}
              type="button"
              aria-pressed={isOn}
              onClick={() => onToggleType(type)}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm',
                isOn ? 'border-[var(--t)] text-[var(--t)]' : 'border-[var(--l)] text-[var(--m)]',
              )}
            >
              <span
                aria-hidden="true"
                className="viz-root inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: isOn ? EVENT_TYPE_COLORS[type] : 'transparent', border: isOn ? 'none' : '1px solid var(--l)' }}
              />
              {EVENT_TYPE_LABELS[type]}
            </button>
          )
        })}
      </div>

      {admin && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Report scope" value={admin.scope} onChange={(event) => admin.onScope(event.target.value)}>
            <option value={ALL_PRODUCTS}>All products</option>
            {admin.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </SelectField>

          <SelectField label="Moderator" value={admin.userId} onChange={(event) => admin.onUser(event.target.value)}>
            <option value="">All moderators</option>
            {admin.moderators.map((moderator) => (
              <option key={moderator.id} value={moderator.id}>
                {moderator.name}
              </option>
            ))}
          </SelectField>
        </div>
      )}
    </div>
  )
}
