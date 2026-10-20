import z from 'zod'

export const findUsersSchema = z
  .object({
    // q шукає за імʼям або e-mail; name лишився для старих клієнтів.
    q: z.string().trim().max(200).optional(),
    name: z.string().trim().max(200).optional(),
    role: z.enum(['admin', 'moderator', 'user']).optional(),
    lastId: z.string().optional(),
    lastCreatedAt: z.coerce.date().optional(),
  })
  .refine((data) => Boolean(data.lastId) === Boolean(data.lastCreatedAt), {
    message: 'Both cursor fields are required',
  })

export const changeUserRoleSchema = z.object({
  role: z.enum(
    ['admin', 'moderator', 'user'],
    'New role must be admin, moderator or user'
  ),
})

//dto

export type FindUsersDto = z.infer<typeof findUsersSchema>
