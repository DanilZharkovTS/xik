import { create } from 'zustand'

export type Locale = 'en' | 'es' | 'uk'

// Мови публічної частини й кабінету клієнта. У кабінеті модератора й адміна лише en і uk.
export const LOCALES: readonly Locale[] = ['en', 'es', 'uk']
export const WORKSPACE_LOCALES: readonly Locale[] = ['en', 'uk']
export const DEFAULT_LOCALE: Locale = 'en'

export const isLocale = (value: string | undefined | null): value is Locale =>
  value === 'en' || value === 'es' || value === 'uk'

const STORAGE_KEY = 'xik-locale'

type I18nState = {
  locale: Locale
  setLocale: (locale: Locale) => void
  initLocale: () => void
}

// Стартова мова en, щоб сервер і клієнт рендерили однаково; збережену або мову браузера
// підставляє initLocale вже після гідрації.
export const useI18nStore = create<I18nState>((set) => ({
  locale: DEFAULT_LOCALE,

  setLocale: (locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {}
    set({ locale })
  },

  initLocale: () => {
    let locale: Locale = DEFAULT_LOCALE

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLocale(stored)) {
        locale = stored
      } else {
        const browser = navigator.language.toLowerCase()
        if (browser.startsWith('uk')) locale = 'uk'
        else if (browser.startsWith('es')) locale = 'es'
      }
    } catch {}

    set({ locale })
  },
}))
