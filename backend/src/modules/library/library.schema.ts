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

export const getLicenseKeySchema = z.object({
  subscriptionId: z.string().min(1, 'subscriptionId is required'),
})

//dto

export type GrantLibraryAccessDto = z.infer<typeof grantLibraryAccessSchema>
export type RenewLibraryAccessDto = z.infer<typeof renewLibraryAccessSchema>
export type GetLicenseKeyDto = z.infer<typeof getLicenseKeySchema>

