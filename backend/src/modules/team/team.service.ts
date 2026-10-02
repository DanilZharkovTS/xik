import bcrypt from 'bcrypt'
import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { sessionRepo } from '../auth/repos/session.repo.js'
import { auditRepo } from '../audit/audit.repo.js'
import { membershipRepo } from '../access/membership.repo.js'
import { teamRepo } from './team.repo.js'
import type { CreateModeratorDto } from './team.schema.js'

const requireModerator = async (userId: string) => {
  const moderator = await teamRepo.findModeratorById(userId)

  if (!moderator) {
    throw ApiError(404, 'MODERATOR_NOT_FOUND', 'Moderator not found')
  }

  return moderator
}

export const teamService = {
  listModerators: async () => {
    const moderators = await teamRepo.listModerators()

    return {
      response: {
        moderators: moderators.map(({ memberships, ...moderator }) => ({
          ...moderator,
          products: memberships.map((m) => m.product),
        })),
      },
    }
  },
  createModerator: async (admin: TokenPayload, data: CreateModeratorDto) => {
    if (await teamRepo.findUserByEmail(data.email)) {
      throw ApiError(409, 'USER_EXISTS', 'User with this email already exists')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const moderator = await prisma.$transaction(async (tx) => {
      const created = await teamRepo.createModerator(
        { email: data.email, name: data.name, passwordHash },
        tx
      )
      await auditRepo.record(
        {
          actorUserId: admin.id,
          action: 'moderator_created',
          targetUserId: created.id,
        },
        tx
      )
      return created
    })

    return { response: { moderator } }
  },
  resetPassword: async (
    admin: TokenPayload,
    userId: string,
    password: string
  ) => {
    await requireModerator(userId)

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.$transaction(async (tx) => {
      await teamRepo.updatePassword(userId, passwordHash, tx)
      // Зі старим паролем відкриті сесії більше не повинні діяти.
      await sessionRepo.revokeAllForUser(userId, tx)
      await auditRepo.record(
        { actorUserId: admin.id, action: 'password_reset', targetUserId: userId },
        tx
      )
    })

    return { response: { passwordReset: true } }
  },
  deactivate: async (admin: TokenPayload, userId: string) => {
    await requireModerator(userId)

    await prisma.$transaction(async (tx) => {
      await teamRepo.setDeactivatedAt(userId, new Date(), tx)
      await sessionRepo.revokeAllForUser(userId, tx)
      await auditRepo.record(
        {
          actorUserId: admin.id,
          action: 'user_deactivated',
          targetUserId: userId,
        },
        tx
      )
    })

    return { response: { deactivated: true } }
  },
  activate: async (admin: TokenPayload, userId: string) => {
    await requireModerator(userId)

    // Членства не чіпаємо: після повернення акаунта вони відновлюються самі.
    await prisma.$transaction(async (tx) => {
      await teamRepo.setDeactivatedAt(userId, null, tx)
      await auditRepo.record(
        {
          actorUserId: admin.id,
          action: 'user_activated',
          targetUserId: userId,
        },
        tx
      )
    })

    return { response: { activated: true } }
  },
  grantProduct: async (
    admin: TokenPayload,
    userId: string,
    productId: string
  ) => {
    await requireModerator(userId)

    const product = await teamRepo.findProductById(productId)

    if (!product) {
      throw ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
    }

    await prisma.$transaction(async (tx) => {
      if (await membershipRepo.findActive(userId, productId, tx)) {
        throw ApiError(409, 'ALREADY_GRANTED', 'Product is already granted')
      }

      await membershipRepo.grant(userId, productId, admin.id, tx)
      await auditRepo.record(
        {
          actorUserId: admin.id,
          action: 'product_granted',
          targetUserId: userId,
          productId,
        },
        tx
      )
    })

    return { response: { granted: true } }
  },
  revokeProduct: async (
    admin: TokenPayload,
    userId: string,
    productId: string
  ) => {
    await requireModerator(userId)

    await prisma.$transaction(async (tx) => {
      const membership = await membershipRepo.findActive(userId, productId, tx)

      if (!membership) {
        throw ApiError(404, 'MEMBERSHIP_NOT_FOUND', 'Product is not granted')
      }

      await membershipRepo.revoke(membership.id, admin.id, tx)
      await auditRepo.record(
        {
          actorUserId: admin.id,
          action: 'product_revoked',
          targetUserId: userId,
          productId,
        },
        tx
      )
    })

    return { response: { revoked: true } }
  },
}
