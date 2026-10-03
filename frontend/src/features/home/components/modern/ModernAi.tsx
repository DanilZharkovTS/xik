'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { ApiCatalogProduct } from '@/src/features/catalog/catalog.types'
import { formatPrice, productHref } from '@/src/features/catalog/catalog-product'

type ModernAiProps = {
  agents: ApiCatalogProduct[]
}

export function ModernAi({ agents }: ModernAiProps) {
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
              AI Products & Agents
            </div>
            <h2 className="mt-1.5 text-[clamp(34px,4vw,54px)] font-bold leading-[1] tracking-[-0.045em] text-[var(--t)]">
              AI, with a job.
            </h2>
          </div>
          <div className="max-w-[480px] text-base leading-relaxed text-[var(--m)]">
            Purpose-built AI products and autonomous systems designed around concrete workflows rather than generic chat.
          </div>
        </div>

        {agents.length === 0 ? (
          <p className="rounded-[24px] border border-[var(--l)] bg-[var(--bg)] p-8 text-center text-sm text-[var(--m)]">
            AI agents are coming soon.
          </p>
        ) : (
          /* Mobile first: one column, then 2 and 4 */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent, index) => {
              const isBuilding = agent.status === 'build'
              const price = formatPrice(agent)

              return (
                <Link
                  key={agent.id}
                  href={productHref(agent)}
                  className="group relative flex min-h-[260px] cursor-pointer flex-col justify-between rounded-[24px] border border-[var(--l)] bg-[var(--bg)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-xl sm:min-h-[290px]"
                >
                  {/* Status Indicator */}
                  <span
                    className={`absolute right-5 top-5 size-2 rounded-full ${
                      isBuilding ? 'bg-[#ff9f0a]' : 'bg-[#30d158]'
                    }`}
                    title={isBuilding ? 'In Development' : 'Active'}
                    role="img"
                    aria-label={isBuilding ? 'In Development' : 'Active'}
                  />

                  <div>
                    <div className="line-clamp-1 pr-5 text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
                      {String(index + 1).padStart(2, '0')} · {agent.categoryLabel ?? 'AI Agent'}
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
                      <span className="transition-colors group-hover:underline">Explore agent</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                    {price && <span className="text-[var(--t)]">{price}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
