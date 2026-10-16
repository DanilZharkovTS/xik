'use client'

import React from 'react'
import Link from 'next/link'

import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'

export function ModernFooter() {
  const { t } = useI18n()
  const lp = useLocalePath()

  return (
    <footer className="border-t border-[var(--l)] bg-[var(--bg)] px-6 py-14 text-[13px] text-[var(--m)] transition-colors md:py-16">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5 md:gap-8">
          {/* Brand & Status Column */}
          <div className="flex flex-col gap-4 sm:col-span-2">
            <Link
              href={lp('/')}
              className="inline-block text-xl font-[800] tracking-tight text-[var(--t)] transition-opacity hover:opacity-80"
            >
              XIK<span aria-hidden="true" className="logo-cursor">_</span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-[var(--m)]">
              {t('site.footer.tagline')}
            </p>
          </div>

          {/* Column 2: Products & AI */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--t)]">
              {t('site.footer.products')}
            </div>
            <nav aria-label={t('site.footer.products')} className="flex flex-col gap-2.5 text-xs">
              <Link href={lp('/products')} className="transition-colors hover:text-[var(--t)]">
                {t('site.nav.products')}
              </Link>
              <Link href={lp('/ai')} className="transition-colors hover:text-[var(--t)]">
                {t('site.nav.ai')}
              </Link>
              <Link href={lp('/#products')} className="transition-colors hover:text-[var(--t)]">
                {t('home.hero.cta1')}
              </Link>
              <Link href={lp('/#ai')} className="transition-colors hover:text-[var(--t)]">
                {t('home.hero.cta2')}
              </Link>
            </nav>
          </div>

          {/* Column 3: Resources */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--t)]">
              {t('site.footer.resources')}
            </div>
            <nav aria-label={t('site.footer.resources')} className="flex flex-col gap-2.5 text-xs">
              <Link href={lp('/blog')} className="transition-colors hover:text-[var(--t)]">
                {t('site.nav.blog')}
              </Link>
              <a
                href="/blog/feed.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--t)]"
              >
                RSS Feed
              </a>
              <Link href={lp('/#services')} className="transition-colors hover:text-[var(--t)]">
                {t('site.nav.services')}
              </Link>
            </nav>
          </div>

          {/* Column 4: Company & Account */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--t)]">
              {t('site.footer.company')}
            </div>
            <nav aria-label={t('site.footer.company')} className="flex flex-col gap-2.5 text-xs">
              <Link href={lp('/#about')} className="transition-colors hover:text-[var(--t)]">
                {t('site.nav.about')}
              </Link>
              <Link href={lp('/login')} className="transition-colors hover:text-[var(--t)]">
                {t('site.signIn')}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[var(--l)] pt-6 text-xs text-[var(--m)] sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} XIK Lab. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href={lp('/#top')} className="transition-colors hover:text-[var(--t)]">
              ↑ Back to top
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
