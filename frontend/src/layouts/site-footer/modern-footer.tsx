'use client'

import React from 'react'
import Link from 'next/link'

import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'

export function ModernFooter() {
  const { t } = useI18n()
  const lp = useLocalePath()

  return (
    <footer className="border-t border-[var(--l)] px-6 py-9 text-[13px] text-[var(--m)] transition-colors">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <b className="font-bold text-[var(--t)]">XIK.APP</b>
          <span>{t('site.footer.tagline')}</span>
        </div>

        <nav aria-label={t('site.footer.nav')} className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <Link href={lp('/products')} className="transition-colors hover:text-[var(--t)]">
            {t('site.nav.products')}
          </Link>
          <Link href={lp('/ai')} className="transition-colors hover:text-[var(--t)]">
            {t('site.nav.ai')}
          </Link>
          <Link href={lp('/services')} className="transition-colors hover:text-[var(--t)]">
            {t('site.nav.services')}
          </Link>
          <Link href={lp('/blog')} className="transition-colors hover:text-[var(--t)]">
            {t('site.nav.blog')}
          </Link>
          <Link href={lp('/#about')} className="transition-colors hover:text-[var(--t)]">
            {t('site.nav.about')}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
