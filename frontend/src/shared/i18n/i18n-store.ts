import { create } from 'zustand'

export type Locale = 'en' | 'uk'

export const LOCALES: readonly Locale[] = ['en', 'uk']

const STORAGE_KEY = 'xik-locale'

type I18nState = {
  locale: Locale
  setLocale: (locale: Locale) => void
  initLocale: () => void
}

// Стартова мова en, щоб сервер і клієнт рендерили однаково; збережену або мову браузера
// підставляє initLocale вже після гідрації.
export const useI18nStore = create<I18nState>((set) => ({
  locale: 'en',

  setLocale: (locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {}
    set({ locale })
  },

  initLocale: () => {
    let locale: Locale = 'en'

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'en' || stored === 'uk') {
        locale = stored
      } else if (navigator.language.toLowerCase().startsWith('uk')) {
        locale = 'uk'
      }
    } catch {}

    set({ locale })
  },
}))
