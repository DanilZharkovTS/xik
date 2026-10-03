'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import { Segmented } from '@/src/shared/ui/segmented'
import { adminProductsService } from '../admin-products.service'
import type { AdminProduct, ListState, ProductKind } from '../admin-products.types'
import { AdminProductCard } from './AdminProductCard'
import { ProductFormSheet } from './ProductFormSheet'
import type { MessageKey } from '@/src/shared/i18n/messages'
import { useI18n } from '@/src/shared/i18n/use-i18n'

type KindFilter = ProductKind | 'all'

const KIND_VALUES: { value: KindFilter; labelKey: MessageKey }[] = [
  { value: 'all', labelKey: 'products.all' },
  { value: 'product', labelKey: 'products.products' },
  { value: 'agent', labelKey: 'products.agents' },
]

const STATE_VALUES: { value: ListState; labelKey: MessageKey }[] = [
  { value: 'active', labelKey: 'products.active' },
  { value: 'archived', labelKey: 'products.archived' },
]

// Підкреслені вкладки: окремий тип контролу від полів пошуку й типу, щоб не плутати.
function StateTabs({
  value,
  onChange,
}: {
  value: ListState
  onChange: (value: ListState) => void
}): ReactElement {
  const { t } = useI18n()

  return (
    <div role="tablist" aria-label={t('products.state')} className="flex border-b border-[var(--l)]">
      {STATE_VALUES.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            '-mb-px min-h-11 flex-1 border-b-2 px-4 text-base font-medium transition-colors md:flex-none md:px-8',
            value === tab.value
              ? 'border-[var(--t)] text-[var(--t)]'
              : 'border-transparent text-[var(--m)] hover:text-[var(--t)]',
          )}
        >
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  )
}

export function AdminProductsScreen(): ReactElement {
  const { t } = useI18n()
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
    if (!window.confirm(t('products.confirmArchive', { name: product.name }))) return

    void run(product, () => adminProductsService.archive(product.id, token!), t('products.archivedToast'))
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 px-4 py-3 md:space-y-6 md:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium md:text-4xl">{t('products.title')}</h1>
          <p className="mt-0.5 text-sm text-[var(--m)] md:mt-1 md:text-base">
            {t('products.subtitle')}
          </p>
        </div>

        <div>
          <Button className="shrink-0" disabled={!token} onClick={openCreate}>
            {t('products.new')}
          </Button>
        </div>
      </div>

      <StateTabs value={state} onChange={setState} />

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--m)]"
          />
          <input
            type="search"
            aria-label={t('products.searchLabel')}
            placeholder={t('products.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-10 w-full rounded-full border border-[var(--l)] bg-[var(--bg)] pl-10 pr-4 text-base outline-none focus:border-[var(--t)] md:min-h-11"
          />
        </div>

        <Segmented
          label={t('products.type')}
          value={kind}
          onChange={setKind}
          options={KIND_VALUES.map((item) => ({ value: item.value, label: t(item.labelKey) }))}
          className="md:w-72"
        />
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-[var(--m)]">{t('common.loading')}</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-[var(--l)] px-4 py-12 text-center">
          <p className="font-medium">
            {state === 'archived' ? t('products.noArchived') : t('products.noneFound')}
          </p>
          <p className="mt-1 text-sm text-[var(--m)]">
            {state === 'archived'
              ? t('products.archivedHint')
              : t('products.createHint')}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                  t('products.syncedToast'),
                )
              }
              onArchive={() => archive(product)}
              onRestore={() =>
                void run(
                  product,
                  () => adminProductsService.restore(product.id, token!),
                  t('products.restoredToast'),
                )
              }
            />
          ))}
        </ul>
      )}


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
