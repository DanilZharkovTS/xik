export type EventType = 'first' | 'repeat' | 'reply' | 'publication'

export const EVENT_TYPES: readonly EventType[] = ['first', 'repeat', 'reply', 'publication']

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  first: 'New contacts',
  repeat: 'Repeat contacts',
  reply: 'Replies',
  publication: 'Publications',
}

// Колір належить типу події, а не позиції: фільтр не перефарбовує решту.
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  first: 'var(--viz-s1)',
  repeat: 'var(--viz-s2)',
  reply: 'var(--viz-s3)',
  publication: 'var(--viz-s4)',
}

export type Period = 'day' | 'week' | 'month' | 'year' | 'custom'

export const PERIODS: readonly Period[] = ['day', 'week', 'month', 'year', 'custom']

export const PERIOD_LABELS: Record<Period, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  custom: 'Custom',
}

export interface ReportCounts {
  first: number
  repeat: number
  reply: number
  publication: number
  contacts: number
  total: number
}

export interface SeriesPoint extends ReportCounts {
  bucket: string
}

export interface ChannelRow extends ReportCounts {
  channel: string
}

export interface NamedRow extends ReportCounts {
  id: string
  name: string
}

export interface Report {
  range: {
    period: Period
    from: string
    to: string
    days: number
    granularity: 'day' | 'month'
    timeZone: string
  }
  totals: ReportCounts
  series: SeriesPoint[]
  byChannel: ChannelRow[]
  byModerator?: NamedRow[]
  byProduct?: NamedRow[]
}

export interface ReportQuery {
  period: Period
  date?: string
  from?: string
  to?: string
  types: EventType[]
  userId?: string
  productId?: string
}
