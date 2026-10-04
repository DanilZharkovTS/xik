import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { auditRepo } from '../audit/audit.repo.js'
import { toDetailDto } from './targets.mapper.js'
import { templatesService } from './templates.service.js'
import {
  canMarkDoNotContact,
  canRelease,
  canViewDetails,
} from './targets.policy.js'
import { targetsRepo } from './targets.repo.js'
import type { AddEventDto, DoNotContactDto } from './events.schema.js'

// Блокує рядок цілі й перевіряє доступ уже під блокуванням: статус не зміниться між перевіркою й записом.
const lockOrThrow = async (
  actor: TokenPayload,
  productId: string,
  targetId: string,
  db: Parameters<typeof targetsRepo.lockTarget>[2]
) => {
  const locked = await targetsRepo.lockTarget(productId, targetId, db)

  if (!locked) {
    throw ApiError(404, 'TARGET_NOT_FOUND', 'Target not found')
  }

  if (!canViewDetails(actor, locked)) {
    throw ApiError(403, 'FORBIDDEN', 'This target belongs to another moderator')
  }

  return locked
}

const detailOf = async (
  actor: TokenPayload,
  productId: string,
  targetId: string
) => {
  const detail = await targetsRepo.findDetailById(productId, targetId)
  return { target: toDetailDto(detail!, actor) }
}

export const eventsService = {
  add: async (
    actor: TokenPayload,
    productId: string,
    targetId: string,
    dto: AddEventDto
  ) => {
    const template = await templatesService.resolveForEvent(
      productId,
      dto.templateId
    )

    await prisma.$transaction(async (tx) => {
      const target = await lockOrThrow(actor, productId, targetId, tx)

      // Повторне звернення до «не писати» заборонене; відповідь людини зафіксувати можна.
      if (dto.type === 'repeat' && target.status === 'do_not_contact') {
        throw ApiError(
          409,
          'DO_NOT_CONTACT',
          'Do not contact: repeat contact is not allowed'
        )
      }

      const occurredAt = dto.occurredAt ?? new Date()

      await targetsRepo.createEvent(
        {
          productId,
          targetId,
          userId: actor.id,
          type: dto.type,
          channel: dto.channel,
          url: dto.url,
          comment: dto.comment,
          ...template,
          occurredAt,
        },
        tx
      )

      if (dto.type === 'repeat') {
        await targetsRepo.touchLastContacted(targetId, occurredAt, tx)
      }
    })

    return { status: 201, response: await detailOf(actor, productId, targetId) }
  },
  markDoNotContact: async (
    actor: TokenPayload,
    productId: string,
    targetId: string,
    dto: DoNotContactDto
  ) => {
    await prisma.$transaction(async (tx) => {
      const target = await lockOrThrow(actor, productId, targetId, tx)

      if (!canMarkDoNotContact(actor, target)) {
        throw ApiError(
          409,
          'ALREADY_DO_NOT_CONTACT',
          'Target is already marked do not contact'
        )
      }

      const reason = dto.reason || null

      await targetsRepo.setStatus(targetId, 'do_not_contact', reason, tx)
      await targetsRepo.createEvent(
        {
          productId,
          targetId,
          userId: actor.id,
          type: 'status',
          comment: reason ? `Do not contact: ${reason}` : 'Do not contact',
          occurredAt: new Date(),
        },
        tx
      )
      await auditRepo.record(
        {
          actorUserId: actor.id,
          action: 'target_do_not_contact',
          targetUserId: target.ownerUserId,
          productId,
          meta: { targetId },
        },
        tx
      )
    })

    return { status: 200, response: await detailOf(actor, productId, targetId) }
  },
  release: async (actor: TokenPayload, productId: string, targetId: string) => {
    await prisma.$transaction(async (tx) => {
      const target = await lockOrThrow(actor, productId, targetId, tx)

      if (!canRelease(actor, target)) {
        throw ApiError(
          409,
          'NOT_DO_NOT_CONTACT',
          'Target is not marked do not contact'
        )
      }

      await targetsRepo.setStatus(targetId, 'active', null, tx)
      await targetsRepo.createEvent(
        {
          productId,
          targetId,
          userId: actor.id,
          type: 'status',
          comment: 'Released from do not contact by an administrator',
          occurredAt: new Date(),
        },
        tx
      )
      await auditRepo.record(
        {
          actorUserId: actor.id,
          action: 'target_released',
          targetUserId: target.ownerUserId,
          productId,
          meta: { targetId },
        },
        tx
      )
    })

    return { status: 200, response: await detailOf(actor, productId, targetId) }
  },
}
