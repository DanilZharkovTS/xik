import z from 'zod'
import { CHANNELS } from './normalizers.js'

// Продукт тут не приймається взагалі: його визначає сервер із заголовка й членства.
export const checkSchema = z.object({
  value: z.string().trim().min(1).max(2048),
  channel: z.enum(CHANNELS).optional(),
})

// Дату можна поставити в минуле (робота внесена пізніше), але не в майбутнє.
const occurredAt = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .refine((date) => date.getTime() <= Date.now() + 60_000, {
    message: 'Date cannot be in the future',
  })
  .optional()

export const registerTargetSchema = checkSchema.extend({
  occurredAt,
  displayName: z.string().trim().max(100).optional(),
  url: z
    .url({ protocol: /^https?$/ })
    .max(2048)
    .optional(),
  comment: z.string().trim().max(1000).optional(),
  templateId: z.string().min(1).optional(),
})

export const addIdentifierSchema = checkSchema

// Стан роботи з ціллю: на ньому побудовані фільтри списку й "що зробити сьогодні".
export const TARGET_STATES = [
  'all',
  'awaiting', // написали, відповіді ще немає
  'followUp', // відповіді немає, а останній контакт старший за FOLLOW_UP_DAYS
  'needsAnswer', // людина відповіла після нашого останнього контакту
  'replied', // відповідь була хоч раз
  'doNotContact',
] as const

export type TargetState = (typeof TARGET_STATES)[number]

const targetFilters = {
  state: z.enum(TARGET_STATES).default('all'),
  // Лише для адміна: чиї цілі показати. Модератору сервер завжди підставляє його самого.
  ownerUserId: z.string().min(1).optional(),
  channel: z.enum(CHANNELS).optional(),
  q: z.string().trim().max(200).optional(),
}

export const listTargetsSchema = z.object({
  ...targetFilters,
  lastId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
})

export const exportTargetsSchema = z.object(targetFilters)

//dto

export type CheckDto = z.infer<typeof checkSchema>
export type RegisterTargetDto = z.infer<typeof registerTargetSchema>
export type AddIdentifierDto = z.infer<typeof addIdentifierSchema>
export type ListTargetsDto = z.infer<typeof listTargetsSchema>
export type ExportTargetsDto = z.infer<typeof exportTargetsSchema>
export type TargetFilterDto = ExportTargetsDto
