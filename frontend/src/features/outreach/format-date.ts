import { useI18nStore } from '@/src/shared/i18n/i18n-store'
import { translateNow } from '@/src/shared/i18n/translate'

const currentLocale = () => useI18nStore.getState().locale

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

const parse = (value: string | null | undefined): Date | null => {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// Некоректну дату показуємо явно: «—» сховав би помилку в даних.

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—'

  const date = parse(value)
  return date
    ? new Intl.DateTimeFormat(currentLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : translateNow('date.invalid')
}

export const formatRelative = (
  value: string | null | undefined,
  now: Date = new Date(),
): string => {
  if (!value) return '—'

  const date = parse(value)
  if (!date) return translateNow('date.invalid')

  const seconds = Math.round((date.getTime() - now.getTime()) / 1000)

  const relativeFormat = new Intl.RelativeTimeFormat(currentLocale(), { numeric: 'auto' })

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeFormat.format(Math.round(seconds / size), unit)
    }
  }

  return relativeFormat.format(0, 'second')
}
