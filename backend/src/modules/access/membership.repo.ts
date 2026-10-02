import { prisma, type DbClient } from '../../shared/database/prisma.js'

export const membershipRepo = {
  findActive: async (
    userId: string,
    productId: string,
    db: DbClient = prisma
  ) => {
    const membership = await db.productMembership.findFirst({
      where: { userId, productId, revokedAt: null },
    })
    return membership
  },
  listActiveProducts: async (userId: string) => {
    const memberships = await prisma.productMembership.findMany({
      where: { userId, revokedAt: null },
      select: { product: { select: { id: true, slug: true, name: true } } },
      orderBy: { grantedAt: 'asc' },
    })
    return memberships.map((m) => m.product)
  },
  grant: async (
    userId: string,
    productId: string,
    grantedById: string,
    db: DbClient = prisma
  ) => {
    const membership = await db.productMembership.create({
      data: { userId, productId, grantedById },
    })
    return membership
  },
  revoke: async (
    membershipId: string,
    revokedById: string,
    db: DbClient = prisma
  ) => {
    const membership = await db.productMembership.update({
      where: { id: membershipId },
      data: { revokedAt: new Date(), revokedById },
    })
    return membership
  },
}
