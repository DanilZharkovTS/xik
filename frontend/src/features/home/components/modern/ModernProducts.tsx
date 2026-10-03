'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import type { ApiCatalogProduct } from '@/src/features/catalog/catalog.types'
import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'
import { formatPrice, productHref, statusLabel } from '@/src/features/catalog/catalog-product'

type ModernProductsProps = {
  products: ApiCatalogProduct[]
}

export function ModernProducts({ products }: ModernProductsProps) {
  const { t, locale } = useI18n()
  const href = useLocalePath()

  return (
    <section id="products" className="scroll-mt-14 px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1360px]">
        {/* Section Header */}
        <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              {t('home.products.eyebrow')}
            </div>
            <h2 className="mt-1.5 text-[clamp(34px,4vw,54px)] font-bold leading-[1] tracking-[-0.045em] text-[var(--t)]">
              {t('home.products.title')}
            </h2>
          </div>
          <div className="max-w-[480px] text-base leading-relaxed text-[var(--m)]">
            {t('home.products.desc')}
          </div>
        </div>

        {products.length === 0 ? (
          <p className="rounded-[24px] border border-[var(--l)] bg-[var(--s)] p-8 text-center text-sm text-[var(--m)]">
            {t('home.products.empty')}
          </p>
        ) : (
          /* Mobile first: one column, then 2 and 4 */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const price = formatPrice(product, locale)

              return (
                <Link
                  key={product.id}
                  href={href(productHref(product))}
                  className="modern-product-card group relative flex min-h-[260px] cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] border border-[var(--l)] bg-[var(--s)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-xl sm:min-h-[290px]"
                >
                  <div className="relative z-10">
                    <div className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
                      {[product.categoryLabel ?? t('catalog.eyebrow.product'), statusLabel(product.status, locale)].join(' · ')}
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
                      <span className="transition-colors group-hover:underline">{t('home.products.cta')}</span>
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
            href={href('/products')}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--l)] px-5 text-sm font-semibold text-[var(--t)] transition-colors hover:border-[var(--t)]"
          >
            {t('home.products.all')}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
