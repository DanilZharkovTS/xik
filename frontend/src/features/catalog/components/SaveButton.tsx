'use client'

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'

import { accountService } from '@/src/features/account/account.service'
import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { useI18n } from '@/src/shared/i18n/use-i18n'

// "Зберегти" для залогінених клієнтів; гостю кнопки немає (збереження привʼязане до кабінету).
// Сторінка продукту кешується для всіх, тому стан "збережено" питаємо окремо після входу.
export function SaveButton({ productId }: { productId: string }): ReactElement | null {
  const { t, locale } = useI18n()
  const token = useAuthStore((state) => state.accessToken)
  const role = useAuthStore((state) => state.user?.role)
  const [isSaved, setIsSaved] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    if (!token || role !== 'user') return
    let isCurrent = true

    accountService
      .saved(locale, token)
      .then((items) => {
        if (isCurrent) setIsSaved(items.some((item) => item.id === productId))
      })
      .catch(() => undefined)

    return () => {
      isCurrent = false
    }
  }, [token, role, productId, locale])

  if (!token || role !== 'user') return null

  const toggle = async () => {
    try {
      setIsBusy(true)
      const nowSaved = await accountService.toggleSaved(productId, token)
      setIsSaved(nowSaved)
      toast.success(t(nowSaved ? 'account.saved.added' : 'account.saved.removed'))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isBusy}
      aria-pressed={isSaved}
      className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--l)] bg-[var(--bg)] px-6 text-sm font-medium text-[var(--t)] transition-colors hover:bg-[var(--s)] disabled:opacity-60"
    >
      <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
      {isSaved ? t('account.saved.saved') : t('account.saved.add')}
    </button>
  )
}
