import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.email('Please enter a valid email address'),

    name: z
      .string()
      .min(1, 'Name is required')
      .max(50, 'Name must be 50 characters or less'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),

    confirmPassword: z.string('Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

// DTO

export type RegisterDto = z.infer<typeof registerSchema>

export type LoginDto = z.infer<typeof loginSchema>