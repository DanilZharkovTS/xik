'use client'

import React from 'react'
import Link from 'next/link'

import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'

type ModernHeroProps = {
  productCount: number
  agentCount: number
  serviceCount: number
}

export function ModernHero({ productCount, agentCount, serviceCount }: ModernHeroProps) {
  const { t } = useI18n()
  const href = useLocalePath()
  const [badgeHead, ...badgeRest] = t('home.hero.badge').split(' · ')
  const badgeTail = badgeRest.join(' · ')
  const stats = [
    { value: productCount, label: t('home.stats.products') },
    { value: agentCount, label: t('home.stats.agents') },
    { value: serviceCount, label: t('home.stats.services') },
  ].filter((stat) => stat.value > 0)

  return (
    <section
      id="top"
      className="relative flex items-center justify-center px-6 pb-16 pt-[84px] text-center sm:min-h-[780px] sm:py-28 md:min-h-[820px] md:py-36"
      style={{
        background:
          'radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--b) 9%, transparent), transparent 32%)',
      }}
    >
      <div className="mx-auto max-w-[1000px]">
        {/* Release / Innovation Badge */}
        <div className="mb-5 flex justify-center sm:mb-6">
          <Link
            href={href('/#ai')}
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--l)] bg-[var(--s)]/70 px-4 py-1.5 text-xs font-medium text-[var(--t)] backdrop-blur-md transition-all hover:border-[var(--m)] hover:scale-[1.02]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--b)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--b)]" />
            </span>
            {/* На мобільному лише перша частина («Ecosystem 2.0»), щоб бейдж був в один рядок. */}
            <span>
              {badgeHead}
              {badgeTail ? <span className="hidden sm:inline"> · {badgeTail}</span> : null}
            </span>
            <span className="text-[var(--m)] transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <div className="text-sm font-semibold tracking-wide text-[var(--m)] md:text-base">
          {t('home.hero.eyebrow')}
        </div>

        <h1 className="my-4 text-[clamp(44px,8.5vw,108px)] sm:my-5 font-bold leading-[0.92] tracking-[-0.065em] text-[var(--t)] md:my-7">
          {t('home.hero.title1')}<br />{t('home.hero.title2')}
        </h1>

        <p className="mx-auto max-w-[720px] text-[17px] leading-[1.55] sm:text-[clamp(19px,2vw,26px)] sm:leading-relaxed text-[var(--m)]">
          {t('home.hero.sub')}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:items-center">
          <Link
            href={href('/#products')}
            className="inline-flex items-center justify-center rounded-full border border-[var(--t)] bg-[var(--t)] px-7 py-3 text-base font-semibold sm:py-3.5 text-[var(--bg)] transition-all hover:opacity-90 active:scale-95"
          >
            {t('home.hero.cta1')}
          </Link>
          <Link
            href={href('/#ai')}
            className="inline-flex items-center justify-center rounded-full border border-[var(--b)] px-7 py-3 text-base font-semibold sm:py-3.5 text-[var(--b)] transition-all hover:bg-[var(--b)] hover:text-white active:scale-95"
          >
            {t('home.hero.cta2')}
          </Link>
        </div>

        {/* Метрики рахуються з реального каталогу, без вигаданих SLA-цифр. */}
        {stats.length > 0 ? (
          <dl className="mx-auto mt-10 grid max-w-[760px] grid-cols-3 divide-x divide-[var(--l)] rounded-2xl border border-[var(--l)] bg-[var(--s)]/50 py-3 backdrop-blur-md sm:mt-14 sm:py-5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse items-center justify-center px-2 sm:px-4">
                <dt className="mt-1 text-[11px] font-medium leading-tight text-[var(--m)] sm:text-xs">{stat.label}</dt>
                <dd className="m-0 text-2xl font-extrabold tracking-tight text-[var(--t)] sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  )
}
