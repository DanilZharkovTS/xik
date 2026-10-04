import z from 'zod'

export const grantLibraryAccessSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  subscriptionId: z.string(),
  stripeSubscriptionId: z.string(),
  accessExpiresAt: z.coerce.date(),
})

export const renewLibraryAccessSchema = z.object({
  subscriptionId: z.string(),
  accessExpiresAt: z.coerce.date(),
})

//dto

export type GrantLibraryAccessDto = z.infer<typeof grantLibraryAccessSchema>
export type RenewLibraryAccessDto = z.infer<typeof renewLibraryAccessSchema>
