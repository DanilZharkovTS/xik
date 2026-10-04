import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { parseIdentifier, type NormalizedIdentifier } from './normalizers.js'
import { canModify, canViewDetails, isOwner } from './targets.policy.js'
import { toDetailDto, toForeignDto, toListItemDto } from './targets.mapper.js'
import { targetsRepo } from './targets.repo.js'
import { templatesService } from './templates.service.js'
import type {
  AddIdentifierDto,
  CheckDto,
  ListTargetsDto,
  RegisterTargetDto,
} from './targets.schema.js'

// Кидається всередині транзакції, щоб відкотити щойно створену ціль, коли ідентифікатор зайнято.
class IdentifierTaken extends Error {}

const parseOrThrow = (dto: CheckDto): NormalizedIdentifier => {
  const parsed = parseIdentifier(dto.value, dto.channel)

  if (!parsed) {
    throw ApiError(
      400,
      'INVALID_IDENTIFIER',
      dto.channel
        ? `This does not look like a valid ${dto.channel} identifier`
        : 'Could not recognize this value. Choose the channel manually.'
    )
  }

  return parsed
}

// Результат перевірки: вільно / мій / чужий / «не писати». Що саме видно, вирішує політика.
const lookup = async (
  actor: TokenPayload,
  productId: string,
  normalized: NormalizedIdentifier
) => {
  const found = await targetsRepo.findByIdentifier(
    productId,
    normalized.channel,
    normalized.value
  )

  if (!found) {
    return { normalized, status: 'free' as const }
  }

  const status =
    found.status === 'do_not_contact'
      ? ('do_not_contact' as const)
      : isOwner(actor, found)
        ? ('mine' as const)
        : ('foreign' as const)

  const base = { normalized, status, ...toForeignDto(found) }

  if (!canViewDetails(actor, found)) {
    return base
  }

  const detail = await targetsRepo.findDetailById(productId, found.id)

  return { ...base, target: detail ? toDetailDto(detail, actor) : undefined }
}

export const targetsService = {
  check: async (actor: TokenPayload, productId: string, dto: CheckDto) => {
    const result = await lookup(actor, productId, parseOrThrow(dto))
    return { response: result }
  },
  register: async (
    actor: TokenPayload,
    productId: string,
    dto: RegisterTargetDto
  ) => {
    const normalized = parseOrThrow(dto)
    const template = await templatesService.resolveForEvent(productId, dto.templateId)
    const now = new Date()

    try {
      const targetId = await prisma.$transaction(async (tx) => {
        const target = await targetsRepo.createTarget(
          {
            productId,
            displayName: dto.displayName || normalized.value,
            ownerUserId: actor.id,
            firstContactedAt: now,
          },
          tx
        )

        const isFree = await targetsRepo.insertIdentifierIfFree(
          {
            targetId: target.id,
            productId,
            channel: normalized.channel,
            valueNormalized: normalized.value,
          },
          tx
        )

        if (!isFree) throw new IdentifierTaken()

        await targetsRepo.createEvent(
          {
            productId,
            targetId: target.id,
            userId: actor.id,
            type: 'first',
            channel: normalized.channel,
            url: dto.url,
            comment: dto.comment,
            ...template,
            occurredAt: now,
          },
          tx
        )

        return target.id
      })

      const detail = await targetsRepo.findDetailById(productId, targetId)

      return { status: 201, response: { target: toDetailDto(detail!, actor) } }
    } catch (err) {
      if (!(err instanceof IdentifierTaken)) throw err

      // Хтось устиг раніше: показуємо, чия це ціль, замість помилки.
      return {
        status: 409,
        response: {
          code: 'ALREADY_REGISTERED',
          message: 'This identifier is already registered',
          ...(await lookup(actor, productId, normalized)),
        },
      }
    }
  },
  addIdentifier: async (
    actor: TokenPayload,
    productId: string,
    targetId: string,
    dto: AddIdentifierDto
  ) => {
    const normalized = parseOrThrow(dto)
    return prisma.$transaction(async (tx) => {
      const target = await targetsRepo.lockTarget(productId, targetId, tx)

      if (!target) {
        throw ApiError(404, 'TARGET_NOT_FOUND', 'Target not found')
      }

      if (!canViewDetails(actor, target)) {
        throw ApiError(403, 'FORBIDDEN', 'This target belongs to another moderator')
      }

      if (!canModify(actor, target)) {
        throw ApiError(409, 'TARGET_BLOCKED', 'Do not contact: target cannot be changed')
      }

      const isFree = await targetsRepo.insertIdentifierIfFree({
        targetId,
        productId,
        channel: normalized.channel,
        valueNormalized: normalized.value,
      }, tx)

      if (!isFree) {
        throw new IdentifierTaken()
      }
      const detail = await targetsRepo.findDetailById(productId, targetId, tx)
      return { status: 201, response: { target: toDetailDto(detail!, actor) } }
    }).catch(async (err: unknown) => {
      if (!(err instanceof IdentifierTaken)) throw err
      return { status: 409, response: { code: 'ALREADY_REGISTERED', message: 'This identifier is already registered', ...(await lookup(actor, productId, normalized)) } }
    })
  },
  list: async (actor: TokenPayload, productId: string, dto: ListTargetsDto) => {
    const rows = await targetsRepo.listTargets({
      productId,
      // Модератор бачить лише свої цілі, адмін усі.
      ownerUserId: actor.role === 'admin' ? undefined : actor.id,
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
  get: async (actor: TokenPayload, productId: string, targetId: string) => {
    const target = await targetsRepo.findDetailById(productId, targetId)

    if (!target) {
      throw ApiError(404, 'TARGET_NOT_FOUND', 'Target not found')
    }

    if (!canViewDetails(actor, target)) {
      throw ApiError(403, 'FORBIDDEN', 'This target belongs to another moderator')
    }

    return { response: { target: toDetailDto(target, actor) } }
  },
}
