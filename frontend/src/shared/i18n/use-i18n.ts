'use client'

import { useCallback } from 'react'

import { useI18nStore } from './i18n-store'
import { translate } from './translate'
import type { Params } from './translate'
import type { MessageKey } from './messages'

export function useI18n() {
  const locale = useI18nStore((state) => state.locale)
  const setLocale = useI18nStore((state) => state.setLocale)

  const t = useCallback(
    (key: MessageKey, params?: Params) => translate(locale, key, params),
    [locale],
  )

  return { t, locale, setLocale }
}
