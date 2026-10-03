import bcrypt from 'bcrypt'
import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { sessionRepo } from '../auth/repos/session.repo.js'
import { auditRepo } from '../audit/audit.repo.js'
import { membershipRepo } from '../access/membership.repo.js'
import { teamRepo } from './team.repo.js'
import { targetsRepo } from '../outreach/targets.repo.js'
import { toListItemDto } from '../outreach/targets.mapper.js'
import type {
  CreateModeratorDto,
  ListOwnedTargetsDto,
  TransferTargetsDto,
} from './team.schema.js'

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
  // Цілі, якими володіє користувач у продукті. Цілі колишнього учасника лишаються за ним.
  listOwnedTargets: async (dto: ListOwnedTargetsDto) => {
    if (!(await teamRepo.findProductById(dto.productId))) {
      throw ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
    }
    if (!(await teamRepo.findUserBasics(dto.ownerId))) {
      throw ApiError(404, 'USER_NOT_FOUND', 'User not found')
    }

    const rows = await targetsRepo.listTargets({
      productId: dto.productId,
      ownerUserId: dto.ownerId,
      lastId: dto.lastId,
      limit: dto.limit,
    })

    const hasMore = rows.length > dto.limit
    const page = hasMore ? rows.slice(0, dto.limit) : rows

    return {
      response: {
        targets: page.map(toListItemDto),
        nextCursor: hasMore ? page.at(-1)!.id : null,
      },
    }
  },
  // Змінюється лише власник; події цілей лишаються, а в історії дописується запис про передачу.
  transferTargets: async (admin: TokenPayload, dto: TransferTargetsDto) => {
    if (dto.fromUserId === dto.toUserId) {
      throw ApiError(400, 'SAME_USER', 'Choose a different recipient')
    }

    if (!(await teamRepo.findProductById(dto.productId))) {
      throw ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
    }

    const [from, to] = await Promise.all([
      teamRepo.findUserBasics(dto.fromUserId),
      teamRepo.findUserBasics(dto.toUserId),
    ])

    if (!from || !to) {
      throw ApiError(404, 'USER_NOT_FOUND', 'User not found')
    }

    if (to.deactivatedAt) {
      throw ApiError(409, 'RECIPIENT_DEACTIVATED', 'The recipient account is deactivated')
    }

    // Одержувач має працювати в цьому продукті, інакше він не побачить переданих цілей.
    const hasAccess =
      to.role === 'admin' ||
      (to.role === 'moderator' &&
        (await membershipRepo.findActive(to.id, dto.productId)) !== null)

    if (!hasAccess) {
      throw ApiError(
        409,
        'RECIPIENT_NOT_IN_PRODUCT',
        'The recipient does not have access to this product'
      )
    }

    const transferred = await prisma.$transaction(async (tx) => {
      const lockedIds = await teamRepo.lockOwnedTargets(
        {
          productId: dto.productId,
          ownerUserId: dto.fromUserId,
          targetIds: dto.targetIds,
        },
        tx
      )

      if (dto.targetIds && lockedIds.length !== new Set(dto.targetIds).size) {
        throw ApiError(404, 'TARGETS_NOT_FOUND', 'Some targets do not belong to the source user')
      }

      if (lockedIds.length === 0) {
        throw ApiError(409, 'NOTHING_TO_TRANSFER', 'The source user has no targets in this product')
      }

      const now = new Date()

      await teamRepo.reassignTargets(lockedIds, to.id, tx)
      await teamRepo.addTransferNotes(
        {
          productId: dto.productId,
          userId: admin.id,
          targetIds: lockedIds,
          comment: `Transferred from ${from.name} to ${to.name} by an administrator`,
          occurredAt: now,
        },
        tx
      )
      await auditRepo.record(
        {
          actorUserId: admin.id,
          action: 'targets_transferred',
          targetUserId: to.id,
          productId: dto.productId,
          meta: {
            fromUserId: from.id,
            toUserId: to.id,
            count: lockedIds.length,
            targetIds: lockedIds.slice(0, 100),
          },
        },
        tx
      )

      return lockedIds.length
    })

    return { response: { transferred } }
  },
}
