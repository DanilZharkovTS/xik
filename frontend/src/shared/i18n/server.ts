import { DEFAULT_LOCALE, isLocale } from './i18n-store'
import type { Locale } from './i18n-store'

// Мова сторінки з параметра [locale]; хибне значення читається як англійська (сторінку все одно закриває layout).
export async function localeFromParams(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params

  return isLocale(locale) ? locale : DEFAULT_LOCALE
}
