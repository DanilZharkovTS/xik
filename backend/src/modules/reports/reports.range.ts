import { ApiError } from '../../shared/utils/ApiError.js'

export type Period = 'day' | 'week' | 'month' | 'year' | 'custom'

// Календарні дати (YYYY-MM-DD) у налаштованому часовому поясі. to виключний.
export interface DateRange {
  from: string
  to: string
  days: number
  granularity: 'day' | 'month'
}

export const MAX_RANGE_DAYS = 366

// До цієї довжини графік іде по днях, довше по місяцях.
const DAILY_GRANULARITY_MAX_DAYS = 62

const DAY_MS = 24 * 60 * 60 * 1000

const toUtc = (date: string): Date => new Date(`${date}T00:00:00Z`)

const format = (date: Date): string => date.toISOString().slice(0, 10)

// Арифметика лише над календарними датами в UTC: літній час тут не заважає.
export const addDays = (date: string, days: number): string =>
  format(new Date(toUtc(date).getTime() + days * DAY_MS))

const firstOfMonth = (date: string, monthOffset = 0): string => {
  const d = toUtc(date)
  return format(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + monthOffset, 1)))
}

export const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = toUtc(value)
  return Number.isFinite(date.getTime()) && format(date) === value
}

export const daysBetween = (from: string, to: string): number =>
  Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS)

export const todayIn = (timeZone: string, now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

export function resolveRange(
  input: { period: Period; date: string; from?: string; to?: string }
): DateRange {
  const { period, date } = input
  let from: string
  let to: string

  switch (period) {
    case 'day':
      from = date
      to = addDays(date, 1)
      break
    case 'week': {
      // Тиждень починається з понеділка.
      const weekday = (toUtc(date).getUTCDay() + 6) % 7
      from = addDays(date, -weekday)
      to = addDays(from, 7)
      break
    }
    case 'month':
      from = firstOfMonth(date)
      to = firstOfMonth(date, 1)
      break
    case 'year': {
      const year = toUtc(date).getUTCFullYear()
      from = `${year}-01-01`
      to = `${year + 1}-01-01`
      break
    }
    case 'custom': {
      if (!input.from || !input.to) {
        throw ApiError(400, 'RANGE_REQUIRED', 'Custom period needs both from and to')
      }
      if (input.from > input.to) {
        throw ApiError(400, 'INVALID_RANGE', 'The start date is after the end date')
      }
      from = input.from
      to = addDays(input.to, 1)
      break
    }
  }

  const days = daysBetween(from, to)

  if (days > MAX_RANGE_DAYS) {
    throw ApiError(
      400,
      'RANGE_TOO_LARGE',
      `The period cannot be longer than ${MAX_RANGE_DAYS} days`
    )
  }

  return {
    from,
    to,
    days,
    granularity: days <= DAILY_GRANULARITY_MAX_DAYS ? 'day' : 'month',
  }
}

// Усі кошики графіка, зокрема порожні, щоб осі не мали дірок.
export function bucketsOf(range: DateRange): string[] {
  const buckets: string[] = []

  if (range.granularity === 'day') {
    for (let day = range.from; day < range.to; day = addDays(day, 1)) {
      buckets.push(day)
    }
    return buckets
  }

  for (let month = firstOfMonth(range.from); month < range.to; month = firstOfMonth(month, 1)) {
    buckets.push(month)
  }
  return buckets
}
