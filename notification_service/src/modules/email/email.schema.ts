import z from 'zod'

// Мова листа з профілю користувача; без неї англійська.
const locale = z.enum(['en', 'es', 'uk']).optional()

export const sendDeviceKeyEmailSchema = z
  .object({
    to: z.email(),
    device_key: z.string().optional(),
    deviceKey: z.string().optional(),
    productName: z.string(),
    userName: z.string().optional(),
    locale,
  })
  .refine((data) => Boolean(data.device_key || data.deviceKey), {
    message: 'device_key or deviceKey is required',
  })

export const cancelSubscriptionEmailSchema = z.object({
  to: z.email(),
  productName: z.string(),
  userName: z.string().optional(),
  locale
})

export const deleteSubscriptionEmailSchema = z.object({
  to: z.email(),
  productName: z.string(),
  userName: z.string().optional(),
  locale
})

export const paymentAttemptFailedEmailSchema = z.object({
  to: z.email(),
  productName: z.string(),
  userName: z.string().optional(),
  locale
})

export const subscriptionStartedEmailSchema = z.object({
  to: z.email(),
  productName: z.string(),
  userName: z.string().optional(),
  deviceKey: z.string().optional(),
  device_key: z.string().optional(),
  locale,
})

export const passwordResetEmailSchema = z.object({
  to: z.email(),
  token: z.string().min(1, 'token is required'),
  locale: z.enum(['en', 'es', 'uk']),
  userName: z.string().optional(),
})

export const passwordChangedEmailSchema = z.object({
  to: z.email(),
  userName: z.string().optional(),
  locale,
})

//dto

export type SendDeviceKeyEmailDto = z.infer<typeof sendDeviceKeyEmailSchema>

export type CancelSubscriptionEmailDto = z.infer<typeof cancelSubscriptionEmailSchema>

export type DeleteSubscriptionEmailDto = z.infer<typeof deleteSubscriptionEmailSchema>

export type PaymentAttemptFailedEmailDto = z.infer<typeof paymentAttemptFailedEmailSchema>

export type SubscriptionStartedEmailDto = z.infer<typeof subscriptionStartedEmailSchema>

export type PasswordResetEmailDto = z.infer<typeof passwordResetEmailSchema>

export type PasswordChangedEmailDto = z.infer<typeof passwordChangedEmailSchema>

