import z from 'zod'

export const sendSigningKeyEmailSchema = z.object({
  to: z.email(),
  signingKey: z.string(),
  productName: z.string(),
  userName: z.string().optional()
})

export const cancelSubscriptionEmailSchema = z.object({
  to: z.email(),
  productName: z.string(),
  userName: z.string().optional()
})

export const deleteSubscriptionEmailSchema = z.object({
  to: z.email(),
  productName: z.string(),
  userName: z.string().optional()
})

export const paymentAttemptFailedEmailSchema = z.object({
  to: z.email(),
  productName: z.string(),
  userName: z.string().optional()
})

export const subscriptionStartedEmailSchema = z.object({
  to: z.email(),
  productName: z.string(),
  userName: z.string().optional()
})

//dto

export type SendSigningKeyEmailDto = z.infer<typeof sendSigningKeyEmailSchema>

export type CancelSubscriptionEmailDto = z.infer<typeof cancelSubscriptionEmailSchema>

export type DeleteSubscriptionEmailDto = z.infer<typeof deleteSubscriptionEmailSchema>

export type PaymentAttemptFailedEmailDto = z.infer<typeof paymentAttemptFailedEmailSchema>

export type SubscriptionStartedEmailDto = z.infer<typeof subscriptionStartedEmailSchema>
