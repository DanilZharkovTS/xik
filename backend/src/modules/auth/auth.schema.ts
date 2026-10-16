import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z.email(),
    name: z.string().min(1).max(50),
    password: z.string().min(8),
    confirmPassword: z.string(),
    // Мова сайту, з якого зареєструвався користувач: нею підуть листи.
    locale: z.enum(['en', 'es', 'uk']).default('en'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const requestPasswordResetSchema = z.object({
  email: z.email(),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

//dto

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type RequestPasswordResetDto = z.infer<
  typeof requestPasswordResetSchema
>
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>
