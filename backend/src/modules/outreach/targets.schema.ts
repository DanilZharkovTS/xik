import z from 'zod'
import { CHANNELS } from './normalizers.js'

// Продукт тут не приймається взагалі: його визначає сервер із заголовка й членства.
export const checkSchema = z.object({
  value: z.string().trim().min(1).max(2048),
  channel: z.enum(CHANNELS).optional(),
})

export const registerTargetSchema = checkSchema.extend({
  displayName: z.string().trim().max(100).optional(),
  url: z.url({ protocol: /^https?$/ }).max(2048).optional(),
  comment: z.string().trim().max(1000).optional(),
  templateId: z.string().min(1).optional(),
})

export const addIdentifierSchema = checkSchema

export const listTargetsSchema = z.object({
  lastId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
})

//dto

export type CheckDto = z.infer<typeof checkSchema>
export type RegisterTargetDto = z.infer<typeof registerTargetSchema>
export type AddIdentifierDto = z.infer<typeof addIdentifierSchema>
export type ListTargetsDto = z.infer<typeof listTargetsSchema>
