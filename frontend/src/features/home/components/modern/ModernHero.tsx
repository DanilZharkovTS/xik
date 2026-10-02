'use client'

import React from 'react'
import Link from 'next/link'

export function ModernHero() {
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
          XIK Product & AI Lab
        </div>

        <h1 className="my-5 text-[clamp(54px,8.5vw,108px)] font-bold leading-[0.92] tracking-[-0.065em] text-[var(--t)] md:my-7">
          Building things<br />that should exist.
        </h1>

        <p className="mx-auto max-w-[720px] text-[clamp(19px,2vw,26px)] leading-relaxed text-[var(--m)]">
          Independent products, infrastructure and autonomous AI systems engineered around real problems.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="#products"
            className="inline-flex items-center justify-center rounded-full border border-[var(--t)] bg-[var(--t)] px-7 py-3.5 text-base font-semibold text-[var(--bg)] transition-all hover:opacity-90 active:scale-95"
          >
            Explore products
          </Link>
          <Link
            href="#ai"
            className="inline-flex items-center justify-center rounded-full border border-[var(--b)] px-7 py-3.5 text-base font-semibold text-[var(--b)] transition-all hover:bg-[var(--b)] hover:text-white active:scale-95"
          >
            Explore AI
          </Link>
        </div>
      </div>
    </section>
  )
}
