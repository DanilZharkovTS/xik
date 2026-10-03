import { CHANNEL_LABELS, PUBLICATION_CHANNEL_LABELS } from '@/src/features/outreach/outreach.types'

const LABELS: Record<string, string> = {
  ...PUBLICATION_CHANNEL_LABELS,
  ...CHANNEL_LABELS,
  unspecified: 'Not specified',
}

export const channelLabel = (key: string): string => LABELS[key] ?? key
