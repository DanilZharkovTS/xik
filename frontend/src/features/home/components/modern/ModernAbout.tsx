'use client'

import React from 'react'
import { MODERN_PRINCIPLES } from '../../data/modern-home-data'

export function ModernAbout() {
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
          XIK Product & AI Lab
        </div>

        <h2 className="mx-auto my-6 max-w-[1000px] text-[clamp(50px,7.5vw,100px)] font-bold leading-[0.98] tracking-[-0.055em] text-[var(--t)]">
          One ecosystem.<br />Multiple systems.
        </h2>

        <p className="mx-auto max-w-[720px] text-base leading-relaxed text-[var(--m)] md:text-lg">
          XIK is an independent product and AI engineering lab building operational software, autonomous systems and reusable infrastructure. From property operations and observability to AI security, agent runtimes and real-time assistants, every system is built around a concrete job.
        </p>

        {/* 4 Principles Grid */}
        <div className="mx-auto mt-16 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {MODERN_PRINCIPLES.map((principle) => (
            <div
              key={principle.number}
              className="border-t border-[var(--l)] px-1 py-6 transition-colors"
            >
              <span className="mb-8 block text-xs font-semibold text-[var(--m)]">
                {principle.number}
              </span>
              <div className="text-lg font-[650] tracking-tight text-[var(--t)]">
                {principle.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
