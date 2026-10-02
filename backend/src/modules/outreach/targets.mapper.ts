import type { TokenPayload } from '../auth/auth.types.js'
import { identifierHref, type Channel } from './normalizers.js'
import {
  canMarkDoNotContact,
  canModify,
  canRelease,
  canViewDetails,
  isOwner,
} from './targets.policy.js'

interface IdentifierRow {
  channel: string
  valueNormalized: string
}

export const toIdentifierDto = (row: IdentifierRow) => ({
  channel: row.channel,
  value: row.valueNormalized,
  href: identifierHref({
    channel: row.channel as Channel,
    value: row.valueNormalized,
  }),
})

interface EventRow {
  id: string
  type: string
  channel: string | null
  url: string | null
  comment: string | null
  occurredAt: Date
  user: { name: string }
}

export const toEventDto = (row: EventRow) => ({
  id: row.id,
  type: row.type,
  channel: row.channel,
  url: row.url,
  comment: row.comment,
  occurredAt: row.occurredAt,
  author: row.user.name,
})

interface TargetBase {
  id: string
  ownerUserId: string
  displayName: string
  status: string
  statusReason: string | null
  firstContactedAt: Date | null
  lastContactedAt: Date | null
  owner: { id: string; name: string }
  identifiers: IdentifierRow[]
}

export const toListItemDto = (row: TargetBase) => ({
  id: row.id,
  displayName: row.displayName,
  status: row.status,
  owner: { name: row.owner.name },
  firstContactedAt: row.firstContactedAt,
  lastContactedAt: row.lastContactedAt,
  identifiers: row.identifiers.map(toIdentifierDto),
})

// Повні дані цілі: лише для власника й адміна (див. targets.policy).
// Права обчислює сервер, щоб інтерфейс не вгадував їх за роллю.
export const toDetailDto = (
  row: TargetBase & { events: EventRow[] },
  actor: TokenPayload
) => {
  const target = {
    ownerUserId: row.ownerUserId,
    status: row.status as 'active' | 'do_not_contact',
  }

  return {
    ...toListItemDto(row),
    statusReason: row.statusReason,
    isMine: isOwner(actor, target),
    permissions: {
      canRepeat: canModify(actor, target),
      canReply: canViewDetails(actor, target),
      canAddIdentifier: canModify(actor, target),
      canMarkDoNotContact: canMarkDoNotContact(actor, target),
      canRelease: canRelease(actor, target),
    },
    events: row.events.map(toEventDto),
  }
}

// Чужа ціль: лише власник (імʼя) і дата, без історії й ідентифікаторів.
export const toForeignDto = (row: {
  status: string
  firstContactedAt: Date | null
  owner: { name: string }
}) => ({
  owner: { name: row.owner.name },
  firstContactedAt: row.firstContactedAt,
})
