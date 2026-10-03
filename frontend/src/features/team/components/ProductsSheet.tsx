'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { Button } from '@/src/shared/ui/button'
import { Sheet } from '@/src/shared/ui/sheet'
import { teamService } from '../team.service'
import type { Moderator, TeamProduct } from '../team.types'
import { useI18n } from '@/src/shared/i18n/use-i18n'

type ProductsSheetProps = {
  moderator: Moderator | null
  products: TeamProduct[]
  token: string
  onClose: () => void
  onChanged: () => Promise<void>
}

// Кожен продукт додається й забирається окремо одним дотиком; решта доступів не змінюється.
export function ProductsSheet({
  moderator,
  products,
  token,
  onClose,
  onChanged,
}: ProductsSheetProps): ReactElement {
  const { t } = useI18n()
  const [busyId, setBusyId] = useState<string | null>(null)

  const grantedIds = new Set(moderator?.products.map((p) => p.id))

  const toggle = async (productId: string) => {
    if (!moderator) return

    try {
      setBusyId(productId)

      if (grantedIds.has(productId)) {
        await teamService.revokeProduct(moderator.id, productId, token)
      } else {
        await teamService.grantProduct(moderator.id, productId, token)
      }

      await onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Sheet title={t('team.products')} isOpen={moderator !== null} onClose={onClose}>
      <p className="mb-4 break-all text-sm text-[var(--m)]">
        {moderator?.name} · {moderator?.email}
      </p>

      {products.length === 0 ? (
        <p className="py-6 text-center text-[var(--m)]">
          {t('team.productsSheet.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--l)] overflow-hidden rounded-2xl border border-[var(--l)]">
          {products.map((product) => {
            const isGranted = grantedIds.has(product.id)

            return (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-sm text-[var(--m)]">
                    {isGranted ? t('team.productsSheet.has') : t('team.productsSheet.no')}
                  </p>
                </div>

                <Button
                  variant={isGranted ? 'secondary' : 'primary'}
                  className="shrink-0"
                  disabled={busyId !== null}
                  onClick={() => toggle(product.id)}
                >
                  {busyId === product.id
                    ? '...'
                    : isGranted
                      ? t('team.productsSheet.remove')
                      : t('team.productsSheet.add')}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
