import { Prisma } from '../../generated/prisma/client.js'
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
  findUserBasics: async (userId: string, db: DbClient = prisma) => {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, deactivatedAt: true },
    })
    return user
  },
  // Блокує цілі джерела на час передачі: паралельні події й передачі не перегоняють одне одного.
  lockOwnedTargets: async (
    params: { productId: string; ownerUserId: string; targetIds?: string[] },
    db: DbClient
  ) => {
    const rows = await db.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "OutreachTarget"
      WHERE "productId" = ${params.productId}
        AND "ownerUserId" = ${params.ownerUserId}
        ${
          params.targetIds
            ? Prisma.sql`AND "id" IN (${Prisma.join(params.targetIds)})`
            : Prisma.empty
        }
      ORDER BY "id"
      FOR UPDATE
    `
    return rows.map((row) => row.id)
  },
  reassignTargets: async (
    targetIds: string[],
    ownerUserId: string,
    db: DbClient
  ) => {
    await db.outreachTarget.updateMany({
      where: { id: { in: targetIds } },
      data: { ownerUserId },
    })
  },
  addTransferNotes: async (
    params: {
      productId: string
      userId: string
      targetIds: string[]
      comment: string
      occurredAt: Date
    },
    db: DbClient
  ) => {
    await db.outreachEvent.createMany({
      data: params.targetIds.map((targetId) => ({
        productId: params.productId,
        userId: params.userId,
        targetId,
        type: 'status' as const,
        comment: params.comment,
        occurredAt: params.occurredAt,
      })),
    })
  },
}
