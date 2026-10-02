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

export interface TargetEvent {
  id: string
  type: 'first' | 'repeat' | 'reply' | 'publication'
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
