import { translateNow } from '@/src/shared/i18n/translate'
import type { MessageKey } from '@/src/shared/i18n/messages'

// Ключ каналу з звіту: канал контакту, канал публікації або "не вказано".
export const channelLabel = (key: string): string => {
  const candidates = [`channel.${key}`, `pubchan.${key}`] as const
  for (const candidate of candidates) {
    const label = translateNow(candidate as MessageKey)
    if (label !== candidate) return label
  }
  return key
}
