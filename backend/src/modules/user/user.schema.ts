import z from 'zod'

export const findUsersSchema = z.object({
  name: z.string().optional(),
  lastId: z.string().optional(),
  lastCreatedAt: z.coerce.date().optional(),
}).refine((data) => Boolean(data.lastId) === Boolean(data.lastCreatedAt), {
  message: 'Both cursor fields are required',
})

export const changeUserRoleSchema = z.object({
  role: z.enum(['admin', 'moderator', 'user'], 'New role must be admin, moderator or user'),
})

//dto

export type FindUsersDto = z.infer<typeof findUsersSchema>
