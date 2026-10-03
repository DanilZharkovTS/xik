import { z } from 'zod'

export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    locale: z.enum(['en', 'es', 'uk']).optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.locale !== undefined, {
    message: 'Nothing to update',
  })

export type UpdateAccountDto = z.infer<typeof updateAccountSchema>
