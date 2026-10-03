import { translateNow } from '@/src/shared/i18n/translate'

export type Channel = 'telegram' | 'email' | 'linkedin' | 'facebook' | 'website'

export const CHANNELS: readonly Channel[] = [
  'telegram',
  'email',
  'linkedin',
  'facebook',
  'website',
]

export const channelLabel = (channel: Channel): string => translateNow(`channel.${channel}`)

export type TargetStatus = 'active' | 'do_not_contact'

export type CheckStatus = 'free' | 'mine' | 'foreign' | 'do_not_contact'

export interface OutreachProduct {
  id: string
  slug: string
  name: string
}

export interface TargetIdentifier {
  channel: Channel
  value: string
  href: string
}

export type PublicationChannel =
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'tiktok'
  | 'x'
  | 'youtube'
  | 'linkedin'
  | 'telegram'
  | 'website'
  | 'other'

export const PUBLICATION_CHANNELS: readonly PublicationChannel[] = [
  'facebook',
  'instagram',
  'threads',
  'tiktok',
  'x',
  'youtube',
  'linkedin',
  'telegram',
  'website',
  'other',
]

export const publicationChannelLabel = (channel: PublicationChannel): string =>
  translateNow(`pubchan.${channel}`)

export type PublicationKind = 'post' | 'ad' | 'article' | 'link_in_offer'

export const PUBLICATION_KINDS: readonly PublicationKind[] = [
  'post',
  'ad',
  'article',
  'link_in_offer',
]

export const publicationKindLabel = (kind: PublicationKind): string => translateNow(`pubkind.${kind}`)

export interface Publication {
  id: string
  channel: PublicationChannel
  kind: PublicationKind
  url: string
  comment: string | null
  occurredAt: string
  author: string
}

export interface PublicationInput {
  channel: PublicationChannel
  kind: PublicationKind
  url: string
  comment?: string
}

export type PublicationOutcome =
  | { kind: 'created'; publication: Publication }
  | { kind: 'duplicate'; existing: Publication | null }

export interface PublicationsPage {
  publications: Publication[]
  nextCursor: string | null
}

export interface TargetPermissions {
  canRepeat: boolean
  canReply: boolean
  canAddIdentifier: boolean
  canMarkDoNotContact: boolean
  canRelease: boolean
}

export interface ActivityInput {
  type: 'repeat' | 'reply'
  templateId?: string
  channel?: Channel
  url?: string
  comment?: string
}

export type TemplateChannel = Channel | 'any'

export const templateChannelLabel = (channel: TemplateChannel): string =>
  translateNow(`channel.${channel}`)

export type TemplateStatus = 'active' | 'archived'

export interface TemplatePermissions {
  canEdit: boolean
  canArchive: boolean
  canRestore: boolean
  canDuplicate: boolean
  canDelete: boolean
}

export interface Template {
  id: string
  channel: TemplateChannel
  title: string
  subject: string | null
  body: string
  version: number
  status: TemplateStatus
  owner: { name: string }
  isMine: boolean
  createdAt: string
  updatedAt: string
  permissions: TemplatePermissions
}

export interface TemplateInput {
  channel: TemplateChannel
  title: string
  subject?: string
  body: string
}

export type TemplateUpdateOutcome =
  | { kind: 'updated'; template: Template }
  | { kind: 'stale'; template: Template | null }

export interface TargetEvent {
  id: string
  type: 'first' | 'repeat' | 'reply' | 'publication' | 'status'
  template: { id: string; title: string; version: number | null } | null
  channel: Channel | null
  url: string | null
  comment: string | null
  occurredAt: string
  author: string
}

export interface TargetListItem {
  id: string
  displayName: string
  status: TargetStatus
  owner: { name: string }
  firstContactedAt: string | null
  lastContactedAt: string | null
  identifiers: TargetIdentifier[]
}

export interface TargetDetail extends TargetListItem {
  statusReason: string | null
  isMine: boolean
  permissions: TargetPermissions
  events: TargetEvent[]
}

export interface CheckResult {
  normalized: { channel: Channel; value: string }
  status: CheckStatus
  owner?: { name: string }
  firstContactedAt?: string | null
  target?: TargetDetail
}

export interface CheckInput {
  value: string
  channel?: Channel
}

export interface RegisterInput extends CheckInput {
  templateId?: string
  displayName?: string
  url?: string
  comment?: string
}

export type RegisterOutcome =
  | { kind: 'created'; target: TargetDetail }
  | { kind: 'taken'; result: CheckResult }

export interface TargetsPage {
  targets: TargetListItem[]
  nextCursor: string | null
}
