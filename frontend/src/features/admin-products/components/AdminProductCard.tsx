import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'
import { ActionMenu } from '@/src/shared/ui/action-menu'
import type { ActionMenuItem } from '@/src/shared/ui/action-menu'
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

type Tone = 'ok' | 'warn' | 'muted'

function StatusPill({ tone, children, title }: { tone: Tone; children: string; title?: string }): ReactElement {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tone === 'ok' && 'border-[var(--l)] text-[var(--t)]',
        tone === 'warn' && 'border-amber-500/40 bg-amber-500/10 text-amber-600',
        tone === 'muted' && 'border-[var(--l)] text-[var(--m)]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          tone === 'ok' && 'bg-emerald-500',
          tone === 'warn' && 'bg-amber-500',
          tone === 'muted' && 'bg-[var(--m)]',
        )}
      />
      {children}
    </span>
  )
}

// Уся картка відкриває редагування; Stripe і архів у меню "⋯".
// Один статус замість набору бейджів: тип, видимість ціни й Stripe однією фразою.
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
  const kind = product.kind === 'agent' ? t('products.badge.agent') : t('products.badge.product')

  const menu: ActionMenuItem[] = isArchived
    ? [
        { label: t('products.edit'), onSelect: onEdit },
        { label: t('products.restore'), onSelect: onRestore },
      ]
    : [
        { label: t('products.edit'), onSelect: onEdit },
        { label: product.isStripeLinked ? t('products.syncStripe') : t('products.createInStripe'), onSelect: onSync },
        { label: t('products.archive'), onSelect: onArchive, tone: 'danger' },
      ]

  return (
    <li
      className={cn(
        'relative flex min-w-0 flex-col gap-2 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-3 transition-colors hover:border-[var(--m)] md:gap-3 md:p-4',
        isArchived && 'opacity-70',
        isBusy && 'pointer-events-none animate-pulse',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onEdit}
            className="block max-w-full truncate text-left text-lg font-medium after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--t)]"
          >
            {product.name}
          </button>
          <p className="truncate text-sm text-[var(--m)]">
            {kind} · /{product.slug}
          </p>
        </div>

        <div className="relative z-10 -mr-1 -mt-1 flex shrink-0 items-start gap-1">
          <p
            className={cn('pt-1 text-right text-lg font-medium', !product.showPrice && 'text-[var(--m)]')}
            title={product.showPrice ? undefined : t('products.priceNotOnSite')}
          >
            {formatPrice(product)}
            <span className="text-sm font-normal text-[var(--m)]">
              /{t(`products.perPeriod.${product.billingPeriod}`)}
            </span>
            {!product.showPrice && (
              <span className="block text-xs font-normal text-[var(--m)]">{t('products.priceNotOnSite')}</span>
            )}
          </p>
          <ActionMenu label={t('products.actionsFor', { name: product.name })} disabled={isBusy} items={menu} />
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-[var(--m)]">{product.shortDescription}</p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {isArchived ? (
          <StatusPill tone="muted">{t('products.badge.archived')}</StatusPill>
        ) : product.isStripeLinked ? (
          <StatusPill tone="ok" title={product.stripeProductId ?? undefined}>
            {t('products.status.stripeOk')}
          </StatusPill>
        ) : (
          <StatusPill tone="warn">{t('products.badge.notStripe')}</StatusPill>
        )}
        {product.status !== 'production' && <StatusPill tone="muted">{product.status}</StatusPill>}
      </div>
    </li>
  )
}
