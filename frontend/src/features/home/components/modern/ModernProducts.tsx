'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { MODERN_PRODUCTS } from '../../data/modern-home-data'

export function ModernProducts() {
  return (
    <section id="products" className="scroll-mt-14 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-[1360px]">
        {/* Section Header */}
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              Products
            </div>
            <h2 className="mt-1.5 text-[clamp(34px,4vw,54px)] font-bold leading-[1] tracking-[-0.045em] text-[var(--t)]">
              Built to run.
            </h2>
          </div>
          <div className="max-w-[480px] text-base leading-relaxed text-[var(--m)]">
            Independent software products built around real operational workflows, infrastructure and measurable outcomes.
          </div>
        </div>

        {/* Products 4-in-a-row Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODERN_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="modern-product-card group relative flex min-h-[290px] flex-col justify-between overflow-hidden rounded-[24px] border border-[var(--l)] bg-[var(--s)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-xl cursor-pointer"
            >
              <div className="relative z-10">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--m)] line-clamp-1">
                  {product.label}
                </div>

                <h3 className="my-2.5 text-2xl font-bold tracking-tight text-[var(--t)] transition-colors group-hover:text-[var(--b)]">
                  {product.title}
                </h3>

                <p className="text-xs leading-relaxed text-[var(--m)] sm:text-sm line-clamp-4">
                  {product.description}
                </p>
              </div>

              <div className="relative z-10 pt-4 flex items-center gap-1 text-xs font-semibold text-[var(--b)]">
                <span className="transition-colors group-hover:underline">Explore product</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              {/* 3D Gradient Orb */}
              <div className="card-orb" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
