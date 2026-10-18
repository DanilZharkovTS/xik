export interface UserLibrary {
  id: string

  userId: string
  productId: string
  subscriptionId: string | null
  stripeSubscriptionId: string | null
  licenseId: number | null
  licenseKey: string | null

  accessExpiresAt: Date | null
  canceledAt: Date | null
  createdAt: Date
}

