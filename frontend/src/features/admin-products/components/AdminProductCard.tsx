import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import type { AdminProduct } from '../admin-products.types'

type AdminProductCardProps = {
  product: AdminProduct
  isBusy: boolean
  onEdit: () => void
  onSync: () => void
  onArchive: () => void
  onRestore: () => void
}

const formatPrice = (product: AdminProduct): string => {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: product.currency,
    }).format(Number(product.price))
  } catch {
    return `${product.price} ${product.currency}`
  }
}

function Badge({ children, muted }: { children: string; muted?: boolean }): ReactElement {
  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-xs font-medium',
        muted ? 'border-[var(--l)] text-[var(--m)]' : 'border-[var(--t)]',
      )}
    >
      {children}
    </span>
  )
}

export function AdminProductCard({
  product,
  isBusy,
  onEdit,
  onSync,
  onArchive,
  onRestore,
}: AdminProductCardProps): ReactElement {
  const isArchived = product.archivedAt !== null

  return (
    <li
      className={cn(
        'space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4',
        isArchived && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-medium">{product.name}</p>
          <p className="truncate text-sm text-[var(--m)]">/{product.slug}</p>
        </div>
        <p className="shrink-0 text-lg font-medium">
          {formatPrice(product)}
          <span className="text-sm font-normal text-[var(--m)]">/{product.billingPeriod}</span>
        </p>
      </div>

      <p className="text-sm text-[var(--m)]">{product.shortDescription}</p>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{product.kind === 'agent' ? 'Agent' : 'Product'}</Badge>
        <Badge muted>{product.status}</Badge>
        <Badge muted>{product.showPrice ? 'Price shown' : 'Price at checkout'}</Badge>
        {isArchived ? (
          <Badge muted>Archived</Badge>
        ) : product.isStripeLinked ? (
          <Badge>Stripe linked</Badge>
        ) : (
          <Badge muted>Not in Stripe</Badge>
        )}
      </div>

      {product.stripeProductId && (
        <p className="break-all font-mono text-xs text-[var(--m)]">
          {product.stripeProductId}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button className="w-full" disabled={isBusy} onClick={onEdit}>
          Edit
        </Button>

        {isArchived ? (
          <Button variant="secondary" className="w-full" disabled={isBusy} onClick={onRestore}>
            Restore
          </Button>
        ) : (
          <>
            <Button variant="secondary" className="w-full" disabled={isBusy} onClick={onSync}>
              {product.isStripeLinked ? 'Sync Stripe' : 'Create in Stripe'}
            </Button>
            <Button
              variant="secondary"
              className="col-span-2 w-full"
              disabled={isBusy}
              onClick={onArchive}
            >
              Archive
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
