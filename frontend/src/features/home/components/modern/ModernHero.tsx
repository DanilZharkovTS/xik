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
        {/* Release / Innovation Badge */}
        <div className="mb-6 flex justify-center">
          <Link
            href={href('/#ai')}
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--l)] bg-[var(--s)]/70 px-4 py-1.5 text-xs font-medium text-[var(--t)] backdrop-blur-md transition-all hover:border-[var(--m)] hover:scale-[1.02]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--b)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--b)]" />
            </span>
            <span>{t('home.hero.badge')}</span>
            <span className="text-[var(--m)] transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

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

        {/* Ecosystem Live Metrics Bar */}
        <div className="mx-auto mt-14 max-w-[760px] rounded-2xl border border-[var(--l)] bg-[var(--s)]/50 p-4 backdrop-blur-md sm:p-5">
          <div className="grid grid-cols-1 gap-4 divide-y divide-[var(--l)] sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col items-center justify-center px-4 py-2 sm:py-0">
              <span className="text-2xl font-extrabold tracking-tight text-[var(--t)] sm:text-3xl">15+</span>
              <span className="mt-1 text-xs font-medium text-[var(--m)]">{t('home.stats.products')}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-2 sm:py-0">
              <span className="text-2xl font-extrabold tracking-tight text-[var(--t)] sm:text-3xl">99.9%</span>
              <span className="mt-1 text-xs font-medium text-[var(--m)]">{t('home.stats.uptime')}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-2 sm:py-0">
              <span className="text-2xl font-extrabold tracking-tight text-[var(--t)] sm:text-3xl">&lt;50ms</span>
              <span className="mt-1 text-xs font-medium text-[var(--m)]">{t('home.stats.latency')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
