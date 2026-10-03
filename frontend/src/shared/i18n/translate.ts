import { useI18nStore } from './i18n-store'
import type { Locale } from './i18n-store'
import { messages } from './messages'
import type { MessageKey } from './messages'

export type Params = Record<string, string | number>

// Іспанська є лише в публічних і клієнтських ключах; для решти береться англійська.
export const translate = (locale: Locale, key: MessageKey, params?: Params): string => {
  const table: Partial<Record<MessageKey, string>> = messages[locale] ?? messages.en
  const template: string = table[key] ?? messages.en[key] ?? key

  return params
    ? template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
    : template
}

// Для коду поза React (наприклад, тексти помилок): мова з вибору користувача.
export const translateNow = (key: MessageKey, params?: Params): string =>
  translate(useI18nStore.getState().locale, key, params)
