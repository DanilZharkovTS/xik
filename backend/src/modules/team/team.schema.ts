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

export const transferTargetsSchema = z.object({
  productId: z.string().min(1),
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  // Без targetIds переносяться всі цілі джерела в цьому продукті.
  targetIds: z.array(z.string().min(1)).min(1).max(500).optional(),
})

export const listOwnedTargetsSchema = z.object({
  productId: z.string().min(1),
  ownerId: z.string().min(1),
  lastId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

//dto

export type CreateModeratorDto = z.infer<typeof createModeratorSchema>
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>
export type GrantProductDto = z.infer<typeof grantProductSchema>
export type TransferTargetsDto = z.infer<typeof transferTargetsSchema>
export type ListOwnedTargetsDto = z.infer<typeof listOwnedTargetsSchema>
