import z from 'zod'

// bcrypt обрізає пароль після 72 байтів, тому довший не приймаємо.
const password = z.string().min(8).max(72)

export const createModeratorSchema = z.object({
  email: z.email().trim(),
  name: z.string().trim().min(1).max(50),
  password,
})

export const resetPasswordSchema = z.object({
  password,
})

export const grantProductSchema = z.object({
  productId: z.string().min(1),
})

//dto

export type CreateModeratorDto = z.infer<typeof createModeratorSchema>
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>
export type GrantProductDto = z.infer<typeof grantProductSchema>
