import { prisma, type DbClient } from '../../../shared/database/prisma.js'
import type { ActionTokenType } from '../auth.types.js'

export const tokenRepo = {
  createActionToken: async (
    userId: string,
    type: ActionTokenType,
    tokenHash: string,
    expiresAt: Date,
    db: DbClient = prisma
  ) => {
    return db.actionToken.create({
      data: {
        userId,
        type,
        tokenHash,
        expiresAt,
      },
    })
  },
  findActionTokenByHash: async (
    tokenHash: string,
    type: ActionTokenType,
    db: DbClient = prisma
  ) => {
    return db.actionToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    })
  },
  consumeActionToken: async (id: string, db: DbClient = prisma) => {
    return db.actionToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    })
  },
  deleteActionToken: async (
    userId: string,
    type: ActionTokenType,
    db: DbClient = prisma
  ) => {
    return db.actionToken.deleteMany({
      where: {
        userId,
        type,
      },
    })
  },
}
