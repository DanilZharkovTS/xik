'use client'

import type { ReactElement } from 'react'

import { Picker } from '@/src/shared/ui/picker'
import { useOutreachStore } from '../outreach-store'

export function ProductSwitcher(): ReactElement | null {
  const products = useOutreachStore((state) => state.products)
  const selectedProductId = useOutreachStore((state) => state.selectedProductId)
  const selectProduct = useOutreachStore((state) => state.selectProduct)

  if (products.length === 0) return null

  return (
    <div className="min-w-0 flex-1 md:w-64 md:flex-none">
      <Picker
        label="Product"
        hideLabel
        pill
        value={selectedProductId ?? products[0].id}
        onChange={selectProduct}
        options={products.map((product) => ({ value: product.id, label: product.name }))}
      />
    </div>
  )
}
