import { prisma, type DbClient } from '../../../shared/database/prisma.js'

export const sessionRepo = {
  ////////////
  //session
  /////////////
  createSessionWithRefresh: async (
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ) => {
    const session = await prisma.userSession.create({
      data: {
        userId,
        refreshTokens: {
          create: {
            tokenHash,
            expiresAt,
          },
        },
      },
    })
    return session
  },
  findActiveWithUser: async (sessionId: string) => {
    const session = await prisma.userSession.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            deactivatedAt: true,
          },
        },
      },
    })
    return session
  },
  revokeAllForUser: async (userId: string, db: DbClient = prisma) => {
    const now = new Date()

    await db.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    })
    await db.refreshToken.updateMany({
      where: { session: { userId }, revokedAt: null },
      data: { revokedAt: now },
    })
  },
  revokeSessionWithRefreshes: async (sessionId: string) => {
    const session = await prisma.userSession.update({
      where: {
        id: sessionId,
      },
      data: {
        revokedAt: new Date(),
        refreshTokens: {
          updateMany: {
            where: { revokedAt: null },
            data: {
              revokedAt: new Date(),
            },
          },
        },
      },
    })
    return session
  },
  //////////////
  //refresh
  //////////////
  createRefresh: async (
    sessionId: string,
    tokenHash: string,
    expiresAt: Date,
    db: DbClient = prisma
  ) => {
    const refresh = await db.refreshToken.create({
      data: {
        sessionId,
        tokenHash,
        expiresAt,
      },
    })
    return refresh
  },
  findRefreshWithSessionByToken: async (token: string) => {
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: token,
      },
      include: {
        session: true,
      },
    })
    return refreshToken
  },
  findRefreshWithSessionAndUserByToken: async (token: string, db: DbClient = prisma) => {
    const refreshToken = await db.refreshToken.findFirst({
      where: {
        tokenHash: token,
      },
      include: {
        session: { include: { user: true } },
      },
    })
    return refreshToken
  },
  revokeRefresh: async (refreshId: string) => {
    const refresh = await prisma.refreshToken.update({
      where: {
        id: refreshId,
      },
      data: {
        revokedAt: new Date(),
      },
    })
    return refresh
  },
  consumeRefresh: async (refreshId: string, db: DbClient) => {
    const { count } = await db.refreshToken.updateMany({
      where: { id: refreshId, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    })
    return count === 1
  },
  //////////////
  //shared
  //////////////
}
