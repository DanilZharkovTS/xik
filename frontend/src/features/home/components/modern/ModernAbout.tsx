'use client'

import React from 'react'
import { useI18n } from '@/src/shared/i18n/use-i18n'
import { MODERN_PRINCIPLES } from '../../data/modern-home-data'

export function ModernAbout() {
  const { t } = useI18n()

  return (
    <section
      id="about"
      className="scroll-mt-14 px-6 py-32 text-center md:py-40"
      style={{
        background: 'color-mix(in srgb, var(--s) 72%, var(--bg))',
      }}
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="text-sm font-semibold tracking-wide text-[var(--m)]">
          {t('home.about.eyebrow')}
        </div>

        <h2 className="mx-auto my-6 max-w-[1000px] text-[clamp(50px,7.5vw,100px)] font-bold leading-[0.98] tracking-[-0.055em] text-[var(--t)]">
          {t('home.about.title1')}<br />{t('home.about.title2')}
        </h2>

        <p className="mx-auto max-w-[720px] text-base leading-relaxed text-[var(--m)] md:text-lg">
          {t('home.about.body')}
        </p>

        {/* 4 Principles Grid */}
        <div className="mx-auto mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {MODERN_PRINCIPLES.map((principle, index) => (
            <div
              key={principle.number}
              className="border-t border-[var(--l)] px-1 py-6 transition-colors"
            >
              <span className="mb-8 block text-xs font-semibold text-[var(--m)]">
                {principle.number}
              </span>
              <div className="text-lg font-[650] tracking-tight text-[var(--t)]">
                {t(`home.principle.${index + 1}` as 'home.principle.1')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
