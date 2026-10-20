'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { ApiCatalogProduct } from '@/src/features/catalog/catalog.types'
import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'
import { formatPrice, productHref } from '@/src/features/catalog/catalog-product'

type ModernAiProps = {
  agents: ApiCatalogProduct[]
}

export function ModernAi({ agents }: ModernAiProps) {
  const { t, locale } = useI18n()
  const href = useLocalePath()

  return (
    <section
      id="ai"
      className="scroll-mt-14 px-4 py-16 sm:px-6 md:py-24"
      style={{
        background: 'color-mix(in srgb, var(--s) 72%, var(--bg))',
      }}
    >
      <div className="mx-auto max-w-[1360px]">
        {/* Section Header */}
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              {t('home.ai.eyebrow')}
            </div>
            <h2 className="mt-1.5 text-[clamp(34px,4vw,54px)] font-bold leading-[1] tracking-[-0.045em] text-[var(--t)]">
              {t('home.ai.title')}
            </h2>
          </div>
          <div className="max-w-[480px] text-base leading-relaxed text-[var(--m)]">
            {t('home.ai.desc')}
          </div>
        </div>

        {agents.length === 0 ? (
          <p className="rounded-[24px] border border-[var(--l)] bg-[var(--bg)] p-8 text-center text-sm text-[var(--m)]">
            {t('home.ai.empty')}
          </p>
        ) : (
          /* Mobile first: one column, then 2 and 4 */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent, index) => {
              const isBuilding = agent.status === 'build'
              const price = formatPrice(agent, locale)

              return (
                <Link
                  key={agent.id}
                  href={href(productHref(agent))}
                  className="group relative flex min-h-[260px] cursor-pointer flex-col justify-between rounded-[24px] border border-[var(--l)] bg-[var(--bg)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-xl sm:min-h-[290px]"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
                        {String(index + 1).padStart(2, '0')} · {agent.categoryLabel ?? t('catalog.eyebrow.agent')}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isBuilding
                            ? 'border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${isBuilding ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                        {isBuilding ? t('home.ai.building') : t('home.ai.active')}
                      </span>
                    </div>

                    <h3 className="my-2.5 text-xl font-bold tracking-tight text-[var(--t)] transition-colors group-hover:text-[var(--b)] sm:text-[22px]">
                      {agent.name}
                    </h3>

                    <p className="line-clamp-4 text-sm leading-relaxed text-[var(--m)]">
                      {agent.shortDescription}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 text-xs font-semibold text-[var(--b)]">
                    <span className="flex items-center gap-1">
                      <span className="transition-colors group-hover:underline">{t('home.ai.cta')}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                    {price && <span className="text-[var(--t)]">{price}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href={href('/ai')}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--l)] px-5 text-sm font-semibold text-[var(--t)] transition-colors hover:border-[var(--t)]"
          >
            {t('home.ai.all')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
