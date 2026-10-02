'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { MODERN_AI_CARDS } from '../../data/modern-home-data'

export function ModernAi() {
  return (
    <section
      id="ai"
      className="scroll-mt-14 px-6 py-20 md:py-24"
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

        {/* AI Cards 4-in-a-row Grid (2 rows of 4 = 8 cards) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODERN_AI_CARDS.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group relative flex min-h-[290px] flex-col justify-between rounded-[24px] border border-[var(--l)] bg-[var(--bg)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-xl cursor-pointer"
            >
              {/* Status Indicator */}
              <span
                className={`absolute right-5 top-5 size-2 rounded-full ${
                  card.status === 'build' ? 'bg-[#ff9f0a]' : 'bg-[#30d158]'
                }`}
                title={card.status === 'build' ? 'In Development' : 'Active'}
                aria-label={card.status === 'build' ? 'In Development' : 'Active'}
              />

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--m)] pr-5 line-clamp-1">
                  {card.number} · {card.category}
                </div>

                <h3 className="my-2.5 text-xl sm:text-[22px] font-bold tracking-tight text-[var(--t)] transition-colors group-hover:text-[var(--b)]">
                  {card.title}
                </h3>

                <p className="text-xs leading-relaxed text-[var(--m)] sm:text-sm line-clamp-4">
                  {card.description}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-[var(--b)]">
                <span className="transition-colors group-hover:underline">Explore agent</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
