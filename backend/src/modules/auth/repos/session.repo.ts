import { prisma } from '../../../shared/database/prisma.js'

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
    expiresAt: Date
  ) => {
    const refresh = await prisma.refreshToken.create({
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
  findRefreshWithSessionAndUserByToken: async (token: string) => {
    const refreshToken = await prisma.refreshToken.findFirst({
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
  //////////////
  //shared
  //////////////
}
