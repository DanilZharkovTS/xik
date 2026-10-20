import { notFound } from 'next/navigation'
import { isLocale } from './i18n-store'
import type { Locale } from './i18n-store'

// Reject invalid locale parameters before rendering content or public metadata.
export async function localeFromParams(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params

  if (!isLocale(locale)) notFound()
  return locale
}
