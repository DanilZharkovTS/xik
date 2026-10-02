'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { adminProductsService } from '../admin-products.service'
import type { AdminProduct, ListState, ProductKind } from '../admin-products.types'
import { AdminProductCard } from './AdminProductCard'
import { ProductFormSheet } from './ProductFormSheet'

type KindFilter = ProductKind | 'all'

const KIND_TABS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Products' },
  { value: 'agent', label: 'Agents' },
]

const STATE_TABS: { value: ListState; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string
  tabs: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}): ReactElement {
  return (
    <div role="group" aria-label={label} className="flex gap-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'min-h-10 rounded-full border px-4 text-sm font-medium transition-colors',
            value === tab.value
              ? 'border-[var(--t)] bg-[var(--t)] text-[var(--bg)]'
              : 'border-[var(--l)] text-[var(--m)] hover:border-[var(--t)]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function AdminProductsScreen(): ReactElement {
  const token = useAuthStore((state) => state.accessToken)

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [kind, setKind] = useState<KindFilter>('all')
  const [state, setState] = useState<ListState>('active')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminProduct | null>(null)

  // Пошук із паузою, щоб не слати запит на кожну літеру.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    if (!token) return

    try {
      setProducts(
        await adminProductsService.list(
          { state, kind: kind === 'all' ? undefined : kind, q: query || undefined },
          token,
        ),
      )
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [token, state, kind, query])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження даних при зміні фільтрів
    void load()
  }, [load])

  const run = async (product: AdminProduct, action: () => Promise<unknown>, done: string) => {
    try {
      setBusyId(product.id)
      await action()
      toast.success(done)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (product: AdminProduct) => {
    setEditing(product)
    setIsFormOpen(true)
  }

  const archive = (product: AdminProduct) => {
    if (
      !window.confirm(
        `Archive ${product.name}? It disappears from the site and checkout, and the Stripe product is deactivated. You can restore it later.`,
      )
    ) {
      return
    }

    void run(product, () => adminProductsService.archive(product.id, token!), 'Archived')
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium md:text-4xl">Products</h1>
          <p className="mt-1 text-[var(--m)]">
            Products and agents. Each one is linked to a single Stripe product.
          </p>
        </div>

        <div className="hidden md:block">
          <Button className="shrink-0" disabled={!token} onClick={openCreate}>
            New product
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search by name or slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-[var(--l)] bg-[var(--bg)] px-3 text-base outline-none focus:border-[var(--t)]"
        />

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Tabs label="Type" tabs={KIND_TABS} value={kind} onChange={setKind} />
          <Tabs label="State" tabs={STATE_TABS} value={state} onChange={setState} />
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-[var(--m)]">Loading...</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">
            {state === 'archived' ? 'Nothing archived' : 'No products found'}
          </p>
          <p className="mt-1 text-sm text-[var(--m)]">
            {state === 'archived'
              ? 'Archived products show up here and can be restored.'
              : 'Create a product, or run the catalog import to load the existing ones.'}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {products.map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              isBusy={busyId === product.id}
              onEdit={() => openEdit(product)}
              onSync={() =>
                void run(
                  product,
                  () => adminProductsService.syncStripe(product.id, token!),
                  'Stripe is in sync',
                )
              }
              onArchive={() => archive(product)}
              onRestore={() =>
                void run(
                  product,
                  () => adminProductsService.restore(product.id, token!),
                  'Restored',
                )
              }
            />
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-[var(--l)] bg-[var(--bg)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <Button className="min-h-12 w-full" disabled={!token} onClick={openCreate}>
          New product
        </Button>
      </div>

      {token && (
        <ProductFormSheet
          isOpen={isFormOpen}
          product={editing}
          token={token}
          onClose={() => setIsFormOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}
