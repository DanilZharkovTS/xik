import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.email('auth.err.email'),

    name: z
      .string()
      .min(1, 'auth.err.nameRequired')
      .max(50, 'auth.err.nameLong'),

    password: z
      .string()
      .min(8, 'auth.err.passwordShort'),

    confirmPassword: z.string('auth.err.confirmRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.err.mismatch',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.email('auth.err.email'),

  password: z
    .string()
    .min(8, 'auth.err.passwordShort'),
})

export const requestPasswordResetSchema = z.object({
  email: z.email('auth.err.email'),
})

// DTO

export type RegisterDto = z.infer<typeof registerSchema>

export type LoginDto = z.infer<typeof loginSchema>

export type RequestPasswordResetDto = z.infer<
  typeof requestPasswordResetSchema
>