import { useI18nStore } from './i18n-store'
import type { Locale } from './i18n-store'
import { messages } from './messages'
import type { MessageKey } from './messages'

export type Params = Record<string, string | number>

export const translate = (locale: Locale, key: MessageKey, params?: Params): string => {
  const template: string = messages[locale][key] ?? messages.en[key] ?? key

  return params
    ? template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
    : template
}

// Для коду поза React (наприклад, тексти помилок).
export const translateNow = (key: MessageKey, params?: Params): string =>
  translate(useI18nStore.getState().locale, key, params)
