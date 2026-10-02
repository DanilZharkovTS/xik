export interface UserLibrary {
  id: string

  userId: string
  productId: string
  subscriptionId: string
  stripeSubscriptionId: string

  accessExpiresAt: Date
  canceledAt: Date | null
  createdAt: Date
}
