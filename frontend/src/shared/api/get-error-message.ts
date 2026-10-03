import { isAxiosError } from 'axios'

import { translateNow } from '@/src/shared/i18n/translate'
import { useI18nStore } from '@/src/shared/i18n/i18n-store'
import { messages } from '@/src/shared/i18n/messages'
import type { MessageKey } from '@/src/shared/i18n/messages'

// Бекенд повертає { code, message }. Англійською показуємо його точний текст, українською
// переклад за кодом (якщо він є), інакше текст сервера.
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | {
          code?: unknown
          message?: unknown
          errors?: { field?: unknown; message?: unknown }[]
        }
      | undefined

    const key = `err.${String(data?.code)}`

    if (useI18nStore.getState().locale === 'uk' && key in messages.uk) {
      return translateNow(key as MessageKey)
    }

    if (typeof data?.message === 'string' && data.message) {
      return data.message
    }

    // Помилки валідації (zod) приходять списком: показуємо першу з назвою поля.
    const first = data?.errors?.[0]
    if (first && typeof first.message === 'string') {
      return typeof first.field === 'string' ? `${first.field}: ${first.message}` : first.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return translateNow('common.somethingWrong')
}
