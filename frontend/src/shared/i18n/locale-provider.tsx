'use client'

import { createContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { useI18nStore } from './i18n-store'
import type { Locale } from './i18n-store'
import { areaOf } from './paths'

export const LocaleContext = createContext<Locale | null>(null)

// Мова інтерфейсу залежить від розділу:
// - публічний сайт: мова з адреси (/, /es, /uk), її й бачить сервер при рендері;
// - кабінет клієнта й вхід: вибір користувача (en, es або uk);
// - кабінет модератора й адміна: лише en і uk (іспанський вибір там читається як англійська).
export function LocaleProvider({
  urlLocale,
  children,
}: {
  urlLocale: Locale
  children: ReactNode
}) {
  const pathname = usePathname()
  const stored = useI18nStore((state) => state.locale)
  const setLocale = useI18nStore((state) => state.setLocale)

  const area = areaOf(pathname)

  // На публічних сторінках вибір мови запам'ятовується: кабінет відкриється тією ж мовою.
  useEffect(() => {
    if (area === 'public' && stored !== urlLocale) setLocale(urlLocale)
  }, [area, stored, urlLocale, setLocale])

  const locale: Locale =
    area === 'public' ? urlLocale : area === 'workspace' && stored === 'es' ? 'en' : stored

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}
