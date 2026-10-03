import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import type { AdminProduct } from '../admin-products.types'
import { useI18n } from '@/src/shared/i18n/use-i18n'

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
  const { t } = useI18n()
  const isArchived = product.archivedAt !== null

  return (
    <li
      className={cn(
        'min-w-0 space-y-2 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 md:space-y-3 md:p-4',
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
          <span className="text-sm font-normal text-[var(--m)]">/{t(`products.perPeriod.${product.billingPeriod}`)}</span>
        </p>
      </div>

      <p className="text-sm text-[var(--m)]">{product.shortDescription}</p>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{product.kind === 'agent' ? t('products.badge.agent') : t('products.badge.product')}</Badge>
        <Badge muted>{product.status}</Badge>
        <Badge muted>{product.showPrice ? t('products.badge.priceShown') : t('products.badge.priceCheckout')}</Badge>
        {isArchived ? (
          <Badge muted>{t('products.badge.archived')}</Badge>
        ) : product.isStripeLinked ? (
          <Badge>{t('products.badge.linked')}</Badge>
        ) : (
          <Badge muted>{t('products.badge.notStripe')}</Badge>
        )}
      </div>

      {product.stripeProductId && (
        <p className="break-all font-mono text-xs text-[var(--m)]">
          {product.stripeProductId}
        </p>
      )}

      <div className={cn("grid gap-2", isArchived ? "grid-cols-2" : "grid-cols-3")}>
        <Button className="w-full px-2 text-sm md:text-base" disabled={isBusy} onClick={onEdit}>
          {t('products.edit')}
        </Button>

        {isArchived ? (
          <Button variant="secondary" className="w-full" disabled={isBusy} onClick={onRestore}>
            {t('products.restore')}
          </Button>
        ) : (
          <>
            <Button variant="secondary" className="w-full px-2 text-sm md:text-base" disabled={isBusy} onClick={onSync}>
              {product.isStripeLinked ? t('products.sync') : t('products.toStripe')}
            </Button>
            <Button
              variant="secondary"
              className="w-full px-2 text-sm md:text-base"
              disabled={isBusy}
              onClick={onArchive}
            >
              {t('products.archive')}
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
