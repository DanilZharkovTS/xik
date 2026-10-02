import z from 'zod'
import { CHANNELS } from './normalizers.js'

// Змінні, які менеджер підставляє перед копіюванням. Дублюється у фронтенді (render-template.ts).
export const TEMPLATE_VARIABLES = [
  'name',
  'product_name',
  'product_link',
  'manager_name',
] as const

export const TEMPLATE_CHANNELS = [...CHANNELS, 'any'] as const

export type TemplateChannel = (typeof TEMPLATE_CHANNELS)[number]

const VARIABLE_PATTERN = /\{\{\s*([^{}]*?)\s*\}\}/g

// Друкарська помилка у змінній ({{nmae}}) інакше дійшла б до адресата як є.
export const findUnknownVariables = (text: string): string[] => {
  const unknown = new Set<string>()

  for (const [, name] of text.matchAll(VARIABLE_PATTERN)) {
    if (!(TEMPLATE_VARIABLES as readonly string[]).includes(name)) {
      unknown.add(name)
    }
  }

  return [...unknown]
}

const withKnownVariables = (value: string, ctx: z.RefinementCtx) => {
  const unknown = findUnknownVariables(value)

  if (unknown.length > 0) {
    ctx.addIssue({
      code: 'custom',
      message: `Unknown variable: ${unknown.map((name) => `{{${name}}}`).join(', ')}. Allowed: ${TEMPLATE_VARIABLES.map((name) => `{{${name}}}`).join(', ')}`,
    })
  }
}

const title = z.string().trim().min(1).max(100)
const subject = z.string().trim().max(200).superRefine(withKnownVariables)
const body = z.string().trim().min(1).max(5000).superRefine(withKnownVariables)
const channel = z.enum(TEMPLATE_CHANNELS)

export const createTemplateSchema = z.object({
  channel,
  title,
  subject: subject.optional(),
  body,
})

// expectedVersion не дає двом вкладкам одного власника затерти правки одна одної.
export const updateTemplateSchema = z.object({
  expectedVersion: z.number().int().min(1),
  channel: channel.optional(),
  title: title.optional(),
  subject: subject.nullable().optional(),
  body: body.optional(),
})

export const listTemplatesSchema = z.object({
  channel: channel.optional(),
  status: z.enum(['active', 'archived']).default('active'),
})

//dto

export type CreateTemplateDto = z.infer<typeof createTemplateSchema>
export type UpdateTemplateDto = z.infer<typeof updateTemplateSchema>
export type ListTemplatesDto = z.infer<typeof listTemplatesSchema>
