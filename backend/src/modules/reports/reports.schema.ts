import z from 'zod'
import { isValidDate } from './reports.range.js'

export const REPORT_EVENT_TYPES = [
  'first',
  'repeat',
  'reply',
  'publication',
] as const

export type ReportEventType = (typeof REPORT_EVENT_TYPES)[number]

const calendarDate = z.string().refine(isValidDate, {
  message: 'Date must be a real calendar date in YYYY-MM-DD format',
})

// "first,repeat" -> ['first', 'repeat']; порожнє значення означає всі типи.
const types = z
  .string()
  .optional()
  .transform((value) =>
    value
      ? value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : []
  )
  .pipe(z.array(z.enum(REPORT_EVENT_TYPES)))
  .transform((list) =>
    list.length > 0 ? [...new Set(list)] : [...REPORT_EVENT_TYPES]
  )

export const reportQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'custom']).default('day'),
  date: calendarDate.optional(),
  from: calendarDate.optional(),
  to: calendarDate.optional(),
  types,
  userId: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
})

//dto

export type ReportQueryDto = z.infer<typeof reportQuerySchema>
