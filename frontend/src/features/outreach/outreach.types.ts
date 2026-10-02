export type Channel = 'telegram' | 'email' | 'linkedin' | 'facebook' | 'website'

export const CHANNELS: readonly Channel[] = [
  'telegram',
  'email',
  'linkedin',
  'facebook',
  'website',
]

export const CHANNEL_LABELS: Record<Channel, string> = {
  telegram: 'Telegram',
  email: 'Email',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  website: 'Website',
}

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

export const PUBLICATION_CHANNEL_LABELS: Record<PublicationChannel, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  threads: 'Threads',
  tiktok: 'TikTok',
  x: 'X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  website: 'Website',
  other: 'Other',
}

export type PublicationKind = 'post' | 'ad' | 'article' | 'link_in_offer'

export const PUBLICATION_KINDS: readonly PublicationKind[] = [
  'post',
  'ad',
  'article',
  'link_in_offer',
]

export const PUBLICATION_KIND_LABELS: Record<PublicationKind, string> = {
  post: 'Post',
  ad: 'Ad placement',
  article: 'Article',
  link_in_offer: 'Link in an offer',
}

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
  channel?: Channel
  url?: string
  comment?: string
}

export interface TargetEvent {
  id: string
  type: 'first' | 'repeat' | 'reply' | 'publication' | 'status'
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
