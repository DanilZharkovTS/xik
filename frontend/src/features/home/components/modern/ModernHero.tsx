'use client'

import React from 'react'
import Link from 'next/link'

import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'

export function ModernHero() {
  const { t } = useI18n()
  const href = useLocalePath()

  return (
    <section
      id="top"
      className="relative flex min-h-[780px] items-center justify-center px-6 py-28 text-center md:min-h-[820px] md:py-36"
      style={{
        background:
          'radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--b) 9%, transparent), transparent 32%)',
      }}
    >
      <div className="mx-auto max-w-[1000px]">
        <div className="text-sm font-semibold tracking-wide text-[var(--m)] md:text-base">
          {t('home.hero.eyebrow')}
        </div>

        <h1 className="my-5 text-[clamp(54px,8.5vw,108px)] font-bold leading-[0.92] tracking-[-0.065em] text-[var(--t)] md:my-7">
          {t('home.hero.title1')}<br />{t('home.hero.title2')}
        </h1>

        <p className="mx-auto max-w-[720px] text-[clamp(19px,2vw,26px)] leading-relaxed text-[var(--m)]">
          {t('home.hero.sub')}
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href={href('/#products')}
            className="inline-flex items-center justify-center rounded-full border border-[var(--t)] bg-[var(--t)] px-7 py-3.5 text-base font-semibold text-[var(--bg)] transition-all hover:opacity-90 active:scale-95"
          >
            {t('home.hero.cta1')}
          </Link>
          <Link
            href={href('/#ai')}
            className="inline-flex items-center justify-center rounded-full border border-[var(--b)] px-7 py-3.5 text-base font-semibold text-[var(--b)] transition-all hover:bg-[var(--b)] hover:text-white active:scale-95"
          >
            {t('home.hero.cta2')}
          </Link>
        </div>
      </div>
    </section>
  )
}
