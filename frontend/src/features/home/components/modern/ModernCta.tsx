'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'

export function ModernCta() {
  const { t } = useI18n()
  const href = useLocalePath()

  return (
    <section className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1180px]">
        <div
          className="relative overflow-hidden rounded-[32px] border border-[var(--l)] bg-[var(--s)]/60 px-6 py-16 text-center sm:px-12 sm:py-20 md:py-24"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--b) 12%, transparent), transparent 70%), var(--s)',
          }}
        >
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-[clamp(32px,5vw,56px)] font-bold leading-[1.05] tracking-[-0.045em] text-[var(--t)]">
              {t('home.cta.title')}
            </h2>

            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[var(--m)] sm:text-lg">
              {t('home.cta.desc')}
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href={href('/#products')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--t)] bg-[var(--t)] px-7 py-3.5 text-sm font-semibold text-[var(--bg)] transition-all hover:opacity-90 active:scale-95"
              >
                <span>{t('home.cta.button')}</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href={href('/login')}
                className="inline-flex items-center justify-center rounded-full border border-[var(--l)] bg-[var(--bg)] px-7 py-3.5 text-sm font-semibold text-[var(--t)] transition-all hover:border-[var(--m)] hover:bg-[var(--s)] active:scale-95"
              >
                {t('home.cta.login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
