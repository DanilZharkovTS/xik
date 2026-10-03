'use client'

import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'
import { LOCALES } from './i18n-store'
import type { Locale } from './i18n-store'
import { useI18n } from './use-i18n'

const LABELS: Record<Locale, string> = { en: 'EN', uk: 'УК' }

export function LanguageSwitch({ className }: { className?: string }): ReactElement {
  const { t, locale, setLocale } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={cn('flex rounded-full border border-[var(--l)] p-0.5', className)}
    >
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          lang={item}
          aria-pressed={locale === item}
          onClick={() => setLocale(item)}
          className={cn(
            'min-h-7 rounded-full px-2.5 text-xs font-semibold transition-colors',
            locale === item ? 'bg-[var(--t)] text-[var(--bg)]' : 'text-[var(--m)] hover:text-[var(--t)]',
          )}
        >
          {LABELS[item]}
        </button>
      ))}
    </div>
  )
}
