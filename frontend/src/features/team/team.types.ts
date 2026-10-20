export interface TeamProduct {
  id: string
  slug: string
  name: string
}

export interface Moderator {
  id: string
  email: string
  name: string
  createdAt: string
  deactivatedAt: string | null
  products: TeamProduct[]
  activity?: ModeratorActivity
}

export interface ModeratorActivity {
  // Події журналу за останні 7 днів.
  weekEvents: number
  lastEventAt: string | null
  lastSignInAt: string | null
}

export interface CreateModeratorInput {
  email: string
  name: string
  password: string
}

export interface TransferInput {
  productId: string
  fromUserId: string
  toUserId: string
  // Без targetIds переносяться всі цілі джерела в цьому продукті.
  targetIds?: string[]
}
