import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.email(),
    name: z.string().min(1).max(50),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

//dto

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
