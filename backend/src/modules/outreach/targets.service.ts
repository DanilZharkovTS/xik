import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { parseIdentifier, type NormalizedIdentifier } from './normalizers.js'
import { canModify, canViewDetails, isOwner } from './targets.policy.js'
import { toDetailDto, toForeignDto, toListItemDto } from './targets.mapper.js'
import { followUpCutoff, followUpDays } from './follow-up.js'
import type { OwnerSummaryRow, TargetFilter } from './targets.repo.js'
import { targetsRepo } from './targets.repo.js'
import { templatesService } from './templates.service.js'
import type {
  AddIdentifierDto,
  CheckDto,
  ExportTargetsDto,
  ListTargetsDto,
  RegisterTargetDto,
  TargetFilterDto,
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

// Модератор бачить лише свої цілі, адмін усі або вибраного модератора.
const filterFor = (
  actor: TokenPayload,
  productId: string,
  dto: TargetFilterDto
): TargetFilter => ({
  productId,
  ownerUserId: actor.role === 'admin' ? dto.ownerUserId : actor.id,
  state: dto.state,
  channel: dto.channel,
  q: dto.q || undefined,
  followUpBefore: followUpCutoff(),
})

export const EXPORT_LIMIT = 5000

// Значення для CSV: лапки подвоюються, а формули Excel (=, +, -, @) нейтралізуються.
const csvCell = (value: unknown): string => {
  let text =
    value === null || value === undefined
      ? ''
      : value instanceof Date
        ? value.toISOString()
        : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const stateOf = (row: {
  status: string
  lastReplyAt: Date | null
  lastContactedAt: Date | null
}): string => {
  if (row.status === 'do_not_contact') return 'do_not_contact'
  if (
    row.lastReplyAt &&
    (!row.lastContactedAt || row.lastReplyAt >= row.lastContactedAt)
  )
    return 'needs_answer'
  if (row.lastReplyAt) return 'replied'
  return 'awaiting'
}

const summaryResponse = (rows: OwnerSummaryRow[]) => {
  const totals = {
    total: 0,
    awaiting: 0,
    followUp: 0,
    needsAnswer: 0,
    replied: 0,
    doNotContact: 0,
  }
  for (const row of rows) {
    totals.total += row.total
    totals.awaiting += row.awaiting
    totals.followUp += row.followUp
    totals.needsAnswer += row.needsAnswer
    totals.replied += row.replied
    totals.doNotContact += row.doNotContact
  }
  return {
    followUpDays: followUpDays(),
    totals,
    byOwner: rows.map(({ ownerUserId, ...rest }) => ({
      userId: ownerUserId,
      ...rest,
    })),
  }
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
    const template = await templatesService.resolveForEvent(
      productId,
      dto.templateId
    )
    // Перший контакт можна внести заднім числом, як і інші події.
    const now = dto.occurredAt ?? new Date()

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
    return prisma
      .$transaction(async (tx) => {
        const target = await targetsRepo.lockTarget(productId, targetId, tx)

        if (!target) {
          throw ApiError(404, 'TARGET_NOT_FOUND', 'Target not found')
        }

        if (!canViewDetails(actor, target)) {
          throw ApiError(
            403,
            'FORBIDDEN',
            'This target belongs to another moderator'
          )
        }

        if (!canModify(actor, target)) {
          throw ApiError(
            409,
            'TARGET_BLOCKED',
            'Do not contact: target cannot be changed'
          )
        }

        const isFree = await targetsRepo.insertIdentifierIfFree(
          {
            targetId,
            productId,
            channel: normalized.channel,
            valueNormalized: normalized.value,
          },
          tx
        )

        if (!isFree) {
          throw new IdentifierTaken()
        }
        const detail = await targetsRepo.findDetailById(productId, targetId, tx)
        return {
          status: 201,
          response: { target: toDetailDto(detail!, actor) },
        }
      })
      .catch(async (err: unknown) => {
        if (!(err instanceof IdentifierTaken)) throw err
        return {
          status: 409,
          response: {
            code: 'ALREADY_REGISTERED',
            message: 'This identifier is already registered',
            ...(await lookup(actor, productId, normalized)),
          },
        }
      })
  },
  list: async (actor: TokenPayload, productId: string, dto: ListTargetsDto) => {
    const rows = await targetsRepo.listTargets({
      ...filterFor(actor, productId, dto),
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
  exportCsv: async (
    actor: TokenPayload,
    productId: string,
    dto: ExportTargetsDto
  ) => {
    const rows = await targetsRepo.exportTargets(
      filterFor(actor, productId, dto),
      EXPORT_LIMIT
    )
    const header = [
      'name',
      'owner',
      'state',
      'identifiers',
      'first_contact',
      'last_contact',
      'last_reply',
      'replies',
      'do_not_contact_reason',
    ]
    const lines = rows.map((row) =>
      [
        row.displayName,
        row.owner.name,
        stateOf(row),
        row.identifiers
          .map(
            (identifier) =>
              `${identifier.channel}:${identifier.valueNormalized}`
          )
          .join(' '),
        row.firstContactedAt,
        row.lastContactedAt,
        row.lastReplyAt,
        row._count.events,
        row.statusReason,
      ]
        .map(csvCell)
        .join(',')
    )
    // BOM: Excel відкриває UTF-8 з кирилицею правильно.
    return {
      csv: '\uFEFF' + [header.join(','), ...lines].join('\r\n') + '\r\n',
      truncated: rows.length >= EXPORT_LIMIT,
    }
  },
  summary: async (actor: TokenPayload, productId: string) => {
    const rows = await targetsRepo.summaryByOwner({
      productId,
      ownerUserId: actor.role === 'admin' ? undefined : actor.id,
      followUpBefore: followUpCutoff(),
    })
    return { response: summaryResponse(rows) }
  },
  // Адмін поза продуктом: усі продукти або один.
  summaryForAdmin: async (productId?: string) => {
    const followUpBefore = followUpCutoff()
    const [rows, items] = await Promise.all([
      targetsRepo.summaryByOwner({ productId, followUpBefore }),
      targetsRepo.actionItems({ productId, followUpBefore }),
    ])
    return { response: { ...summaryResponse(rows), actionItems: items } }
  },
  get: async (actor: TokenPayload, productId: string, targetId: string) => {
    const target = await targetsRepo.findDetailById(productId, targetId)

    if (!target) {
      throw ApiError(404, 'TARGET_NOT_FOUND', 'Target not found')
    }

    if (!canViewDetails(actor, target)) {
      throw ApiError(
        403,
        'FORBIDDEN',
        'This target belongs to another moderator'
      )
    }

    return { response: { target: toDetailDto(target, actor) } }
  },
}
