'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'
import { LOCALES, WORKSPACE_LOCALES } from './i18n-store'
import type { Locale } from './i18n-store'
import { areaOf, localizedPath } from './paths'
import { useAlternatesStore } from './alternates'
import { useI18n } from './use-i18n'

const LABELS: Record<Locale, string> = { en: 'EN', es: 'ES', uk: 'УК' }

const ITEM = 'inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold transition-colors'
const ACTIVE = 'bg-[var(--t)] text-[var(--bg)]'
const IDLE = 'text-[var(--m)] hover:text-[var(--t)]'

// Публічний сайт: посилання на ту саму сторінку іншою мовою (окрема адреса для пошуку).
// Кабінети: кнопки, що змінюють збережену мову; модератору й адміну доступні лише EN і УК.
export function LanguageSwitch({ className }: { className?: string }): ReactElement {
  const { t, locale, setLocale } = useI18n()
  const pathname = usePathname()
  const area = areaOf(pathname)
  const locales = area === 'workspace' ? WORKSPACE_LOCALES : LOCALES
  const alternates = useAlternatesStore((state) => state.paths)

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={cn('flex rounded-full border border-[var(--l)] p-0.5', className)}
    >
      {locales.map((item) =>
        area === 'public' ? (
          <Link
            key={item}
            // Стаття в мові без перекладу: ведемо до списку блогу цією мовою.
            href={alternates ? localizedPath(alternates[item] ?? '/blog', item) : localizedPath(pathname, item)}
            hrefLang={item}
            lang={item}
            aria-current={locale === item ? 'true' : undefined}
            className={cn(ITEM, locale === item ? ACTIVE : IDLE)}
          >
            {LABELS[item]}
          </Link>
        ) : (
          <button
            key={item}
            type="button"
            lang={item}
            aria-pressed={locale === item}
            onClick={() => setLocale(item)}
            className={cn(ITEM, locale === item ? ACTIVE : IDLE)}
          >
            {LABELS[item]}
          </button>
        ),
      )}
    </div>
  )
}
