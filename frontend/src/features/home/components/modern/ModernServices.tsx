'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'
import { getCatalogItem, localizeItem } from '@/src/features/catalog/data/catalog-items'
import { MODERN_SERVICES, RESEARCH_PILLS } from '../../data/modern-home-data'

export function ModernServices() {
  const { t, locale } = useI18n()
  const href = useLocalePath()

  // Англійські тексти головної свої; для es і uk беремо переклад послуги.
  const services = MODERN_SERVICES.map((service) => {
    const item = locale === 'en' ? null : getCatalogItem(service.slug)
    if (!item) return service
    const localized = localizeItem(item, locale)
    return { ...service, title: localized.title, description: localized.subtitle }
  })

  return (
    <section id="services" className="scroll-mt-14 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-[1360px]">
        {/* Section Header */}
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              {t('home.services.eyebrow')}
            </div>
            <h2 className="mt-1.5 text-[clamp(34px,4vw,54px)] font-bold leading-[1] tracking-[-0.045em] text-[var(--t)]">
              {t('home.services.title')}
            </h2>
          </div>
          <div className="max-w-[480px] text-base leading-relaxed text-[var(--m)]">
            {t('home.services.desc')}
          </div>
        </div>

        {/* Services 2-Column Divided Grid */}
        <div className="grid grid-cols-1 border-t border-[var(--l)] md:grid-cols-2">
          {services.map((service, index) => {
            const isOdd = index % 2 === 0
            return (
              <Link
                key={service.slug}
                href={href(service.href)}
                className={`group block border-b border-[var(--l)] py-7 transition-colors hover:bg-[var(--s)]/40 ${
                  isOdd
                    ? 'md:pr-11'
                    : 'md:border-l md:border-[var(--l)] md:pl-11'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="mb-2 text-2xl font-bold tracking-[-0.03em] text-[var(--t)] transition-colors group-hover:text-[var(--b)] md:text-[25px]">
                    {service.title}
                  </h3>
                  <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--l)] bg-[var(--bg)] text-[var(--m)] transition-all group-hover:border-[var(--m)] group-hover:text-[var(--b)] group-hover:shadow-2xs">
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[var(--m)] md:text-base">
                  {service.description}
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--b)] group-hover:underline">
                    {t('home.services.view')}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Research Pills */}
        <div className="mt-8 flex flex-wrap gap-2.5">
          {RESEARCH_PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-[var(--l)] px-4 py-2 text-xs font-medium text-[var(--m)] transition-colors hover:border-[var(--t)] hover:text-[var(--t)]"
            >
              {pill}
            </span>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={href('/services')}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--l)] px-5 text-sm font-semibold text-[var(--t)] transition-colors hover:border-[var(--t)]"
          >
            {t('home.services.all')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
