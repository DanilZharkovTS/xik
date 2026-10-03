import { useI18nStore } from '@/src/shared/i18n/i18n-store'
import type { Period } from './reports.types'

// Усі дати тут календарні (YYYY-MM-DD) у часовому поясі звіту, тому рахуємо їх у UTC без зсувів.
const toUtc = (date: string): Date => new Date(`${date}T12:00:00Z`)

const format = (date: Date): string => date.toISOString().slice(0, 10)

export const addDays = (date: string, days: number): string => {
  const next = toUtc(date)
  next.setUTCDate(next.getUTCDate() + days)
  return format(next)
}

const addMonths = (date: string, months: number): string => {
  const base = toUtc(date)
  return format(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, 1, 12)))
}

// Зсув опорної дати на один період назад або вперед.
export const shiftAnchor = (period: Period, anchor: string, direction: -1 | 1): string => {
  switch (period) {
    case 'day':
      return addDays(anchor, direction)
    case 'week':
      return addDays(anchor, 7 * direction)
    case 'month':
      return addMonths(anchor, direction)
    case 'year': {
      const base = toUtc(anchor)
      return `${base.getUTCFullYear() + direction}-01-01`
    }
    case 'custom':
      return anchor
  }
}

const formatter = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat(useI18nStore.getState().locale, { ...options, timeZone: 'UTC' })

export const formatDay = (date: string): string => formatter({ day: 'numeric', month: 'short' }).format(toUtc(date))

export const formatMonthShort = (date: string): string => formatter({ month: 'short' }).format(toUtc(date))

export const formatRangeLabel = (period: Period, from: string, to: string): string => {
  switch (period) {
    case 'day':
      return formatter({ day: 'numeric', month: 'short', year: 'numeric' }).format(toUtc(from))
    case 'month':
      return formatter({ month: 'long', year: 'numeric' }).format(toUtc(from))
    case 'year':
      return String(toUtc(from).getUTCFullYear())
    default:
      return `${formatter({ day: 'numeric', month: 'short' }).format(toUtc(from))} – ${formatter({ day: 'numeric', month: 'short', year: 'numeric' }).format(toUtc(to))}`
  }
}

export const dayOfMonth = (date: string): string => String(toUtc(date).getUTCDate())
