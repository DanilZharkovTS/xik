import z from 'zod'

export const findUsersSchema = z.object({
  name: z.string().optional(),
  lastId: z.string().optional(),
  lastCreatedAt: z.date().optional(),
})

export const changeUserRoleSchema = z.object({
  role: z.enum(['admin', 'user'], 'New role must be admin or user'),
})

//dto

export type FindUsersDto = z.infer<typeof findUsersSchema>
