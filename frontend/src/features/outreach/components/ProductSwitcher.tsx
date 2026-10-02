'use client'

import type { ReactElement } from 'react'

import { useOutreachStore } from '../outreach-store'

export function ProductSwitcher(): ReactElement | null {
  const products = useOutreachStore((state) => state.products)
  const selectedProductId = useOutreachStore((state) => state.selectedProductId)
  const selectProduct = useOutreachStore((state) => state.selectProduct)

  if (products.length === 0) return null

  return (
    <div className="min-w-0 flex-1 md:flex-none">
      <label htmlFor="product-switcher" className="sr-only">
        Product
      </label>

      <select
        id="product-switcher"
        value={selectedProductId ?? ''}
        onChange={(event) => selectProduct(event.target.value)}
        className="min-h-11 w-full max-w-full truncate rounded-full border border-[var(--l)] bg-[var(--bg)] px-4 text-base font-medium outline-none focus:border-[var(--t)] md:w-64"
      >
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </div>
  )
}
