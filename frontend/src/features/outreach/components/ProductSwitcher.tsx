'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/src/shared/lib/cn'
import { Sheet } from '@/src/shared/ui/sheet'
import { useOutreachStore } from '../outreach-store'

// На телефоні рідний список select відкривається за межі екрана й не стилізується,
// тому вибір продукту йде через власну шторку. На десктопі лишається звичайний select.
export function ProductSwitcher(): ReactElement | null {
  const products = useOutreachStore((state) => state.products)
  const selectedProductId = useOutreachStore((state) => state.selectedProductId)
  const selectProduct = useOutreachStore((state) => state.selectProduct)
  const [isOpen, setIsOpen] = useState(false)

  if (products.length === 0) return null

  const selected = products.find((product) => product.id === selectedProductId) ?? products[0]

  return (
    <div className="min-w-0 flex-1 md:flex-none">
      <label htmlFor="product-switcher" className="sr-only">
        Product
      </label>

      <select
        id="product-switcher"
        value={selectedProductId ?? ''}
        onChange={(event) => selectProduct(event.target.value)}
        className="hidden min-h-11 w-64 max-w-full truncate rounded-full border border-[var(--l)] bg-[var(--bg)] px-4 text-base font-medium outline-none focus:border-[var(--t)] md:block"
      >
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-full border border-[var(--l)] bg-[var(--bg)] px-4 text-base font-medium md:hidden"
      >
        <span className="sr-only">Product: </span>
        <span className="truncate">{selected.name}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--m)]" />
      </button>

      <Sheet title="Product" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ul className="-mx-1 space-y-0.5">
          {products.map((product) => {
            const isSelected = product.id === selected.id
            return (
              <li key={product.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    selectProduct(product.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-base',
                    isSelected ? 'bg-[var(--s)] font-medium' : 'hover:bg-[var(--s)]',
                  )}
                >
                  <span className="truncate">{product.name}</span>
                  {isSelected && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </div>
  )
}
