'use client'

import { useCallback, useContext } from 'react'

import { useI18nStore } from './i18n-store'
import { LocaleContext } from './locale-provider'
import { withLocale } from './paths'
import { translate } from './translate'
import type { Params } from './translate'
import type { MessageKey } from './messages'

export function useI18n() {
  const fromContext = useContext(LocaleContext)
  const stored = useI18nStore((state) => state.locale)
  const setLocale = useI18nStore((state) => state.setLocale)

  const locale = fromContext ?? stored

  const t = useCallback(
    (key: MessageKey, params?: Params) => translate(locale, key, params),
    [locale],
  )

  return { t, locale, setLocale }
}

// Посилання публічного сайту зберігають мову: href("/products") -> "/es/products".
export function useLocalePath(): (href: string) => string {
  const { locale } = useI18n()

  return useCallback((href: string) => withLocale(href, locale), [locale])
}
