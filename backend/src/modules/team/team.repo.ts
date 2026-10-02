import { prisma, type DbClient } from '../../shared/database/prisma.js'

export const teamRepo = {
  findModeratorById: async (userId: string, db: DbClient = prisma) => {
    const user = await db.user.findFirst({
      where: { id: userId, role: 'moderator' },
      select: { id: true, email: true, name: true, deactivatedAt: true },
    })
    return user
  },
  findUserByEmail: async (email: string) => {
    // Без урахування регістру, щоб не створити дубль до наявного акаунта.
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    })
    return user
  },
  listModerators: async () => {
    const moderators = await prisma.user.findMany({
      where: { role: 'moderator' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        deactivatedAt: true,
        memberships: {
          where: { revokedAt: null },
          orderBy: { grantedAt: 'asc' },
          select: {
            grantedAt: true,
            product: { select: { id: true, slug: true, name: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })
    return moderators
  },
  createModerator: async (
    data: { email: string; name: string; passwordHash: string },
    db: DbClient = prisma
  ) => {
    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: 'moderator',
        credentials: { create: { passwordHash: data.passwordHash } },
      },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    return user
  },
  updatePassword: async (
    userId: string,
    passwordHash: string,
    db: DbClient = prisma
  ) => {
    await db.userCredentials.update({
      where: { userId },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    })
  },
  setDeactivatedAt: async (
    userId: string,
    deactivatedAt: Date | null,
    db: DbClient = prisma
  ) => {
    await db.user.update({
      where: { id: userId },
      data: { deactivatedAt },
    })
  },
  findProductById: async (productId: string, db: DbClient = prisma) => {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    })
    return product
  },
}
