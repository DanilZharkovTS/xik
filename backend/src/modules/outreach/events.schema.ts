import z from 'zod'
import {
  CHANNELS,
  PUBLICATION_CHANNELS,
  PUBLICATION_KINDS,
} from './normalizers.js'

const httpUrl = z.url({ protocol: /^https?$/ }).max(2048)

// Подію можна внести заднім числом, але не з майбутнього (запас на розбіжність годинників).
const occurredAt = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .refine((date) => date.getTime() <= Date.now() + 60_000, {
    message: 'Date cannot be in the future',
  })
  .optional()

export const addEventSchema = z.object({
  type: z.enum(['repeat', 'reply']),
  channel: z.enum(CHANNELS).optional(),
  url: httpUrl.optional(),
  comment: z.string().trim().max(1000).optional(),
  templateId: z.string().min(1).optional(),
  occurredAt,
})

export const doNotContactSchema = z.object({
  reason: z.string().trim().max(500).optional(),
})

export const addPublicationSchema = z.object({
  channel: z.enum(PUBLICATION_CHANNELS),
  kind: z.enum(PUBLICATION_KINDS),
  url: httpUrl,
  comment: z.string().trim().max(1000).optional(),
  occurredAt,
})

export const listPublicationsSchema = z.object({
  lastId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
})

//dto

export type AddEventDto = z.infer<typeof addEventSchema>
export type DoNotContactDto = z.infer<typeof doNotContactSchema>
export type AddPublicationDto = z.infer<typeof addPublicationSchema>
export type ListPublicationsDto = z.infer<typeof listPublicationsSchema>
