import type { ReactElement } from 'react'

import { cn } from '@/src/shared/lib/cn'
import { Button } from '@/src/shared/ui/button'
import type { Moderator } from '../team.types'

type ModeratorCardProps = {
  moderator: Moderator
  isBusy: boolean
  onProducts: () => void
  onPassword: () => void
  onTransfer: () => void
  onToggleActive: () => void
}

const ACTION_CLASS = 'w-full'

export function ModeratorCard({
  moderator,
  isBusy,
  onProducts,
  onPassword,
  onTransfer,
  onToggleActive,
}: ModeratorCardProps): ReactElement {
  const isActive = moderator.deactivatedAt === null

  return (
    <li
      className={cn(
        'space-y-3 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4',
        !isActive && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-medium">{moderator.name}</p>
          <p className="truncate text-sm text-[var(--m)]">
            {moderator.email}
          </p>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            isActive
              ? 'border-[var(--t)]'
              : 'border-[var(--l)] text-[var(--m)]',
          )}
        >
          {isActive ? 'Active' : 'Deactivated'}
        </span>
      </div>

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-wider text-[var(--m)]">
          Products
        </p>

        {moderator.products.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {moderator.products.map((product) => (
              <li
                key={product.id}
                className="rounded-full border border-[var(--l)] bg-[var(--bg)] px-3 py-1 text-sm"
              >
                {product.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--m)]">No products</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          className={ACTION_CLASS}
          disabled={isBusy}
          onClick={onProducts}
        >
          Products
        </Button>

        <Button
          variant="secondary"
          className={ACTION_CLASS}
          disabled={isBusy}
          onClick={onPassword}
        >
          Password
        </Button>

        <Button
          variant="secondary"
          className={ACTION_CLASS}
          disabled={isBusy}
          onClick={onTransfer}
        >
          Transfer targets
        </Button>

        <Button
          variant="secondary"
          className={ACTION_CLASS}
          disabled={isBusy}
          onClick={onToggleActive}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </li>
  )
}
