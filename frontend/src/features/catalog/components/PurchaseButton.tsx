'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { api } from '@/src/shared/api/axios'
import { useI18n, useLocalePath } from '@/src/shared/i18n/use-i18n'
import { getErrorMessage } from '@/src/shared/api/get-error-message'

type PurchaseButtonProps = {
  productId: string
  label: string
}

// Ведемо на оплату у Stripe Checkout (там користувач бачить ціну навіть якщо на сторінці її сховано).
// Без входу спершу відправляємо на сторінку входу.
export function PurchaseButton({ productId, label }: PurchaseButtonProps): ReactElement {
  const router = useRouter()
  const { t, locale } = useI18n()
  const href = useLocalePath()
  const token = useAuthStore((state) => state.accessToken)
  const status = useAuthStore((state) => state.status)
  const [isLoading, setIsLoading] = useState(false)

  const purchase = async () => {
    if (!token) {
      router.push(href('/auth/login'))
      return
    }

    try {
      setIsLoading(true)
      const res = await api.post(
        '/billing/checkout',
        { productId, locale },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      window.location.assign(res.data.url)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={purchase}
      disabled={isLoading || status === 'checking'}
      className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--t)] px-6 text-base font-semibold text-[var(--bg)] transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
    >
      {isLoading ? t('detail.redirecting') : label}
    </button>
  )
}
