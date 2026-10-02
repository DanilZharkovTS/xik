'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { ApiCatalogProduct } from '@/src/features/catalog/catalog.types'
import { formatPrice, productHref, statusLabel } from '@/src/features/catalog/catalog-product'

type ModernProductsProps = {
  products: ApiCatalogProduct[]
}

export function ModernProducts({ products }: ModernProductsProps) {
  return (
    <section id="products" className="scroll-mt-14 px-4 py-16 sm:px-6 md:py-24">
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

        {products.length === 0 ? (
          <p className="rounded-[24px] border border-[var(--l)] bg-[var(--s)] p-8 text-center text-sm text-[var(--m)]">
            Products are coming soon.
          </p>
        ) : (
          /* Mobile first: one column, then 2 and 4 */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const price = formatPrice(product)

              return (
                <Link
                  key={product.id}
                  href={productHref(product)}
                  className="modern-product-card group relative flex min-h-[260px] cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] border border-[var(--l)] bg-[var(--s)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-xl sm:min-h-[290px]"
                >
                  <div className="relative z-10">
                    <div className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
                      {[product.categoryLabel ?? 'Product', statusLabel(product.status)].join(' · ')}
                    </div>

                    <h3 className="my-2.5 text-2xl font-bold tracking-tight text-[var(--t)] transition-colors group-hover:text-[var(--b)]">
                      {product.name}
                    </h3>

                    <p className="line-clamp-4 text-sm leading-relaxed text-[var(--m)]">
                      {product.shortDescription}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-2 pt-4 text-xs font-semibold text-[var(--b)]">
                    <span className="flex items-center gap-1">
                      <span className="transition-colors group-hover:underline">Explore product</span>
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
