import { DEFAULT_LOCALE } from '@/src/shared/i18n/i18n-store'
import type { Locale } from '@/src/shared/i18n/i18n-store'

// Шрифт за замовчуванням у картках (next/og) не має кирилиці, тож для української картка
// лишається англійською, а іспанська (латиниця з діакритикою) малюється як є.
export const ogLocale = (locale: Locale): Locale => (locale === 'uk' ? DEFAULT_LOCALE : locale)
