'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import useAuthStore from '@/src/features/auth/store'
import { api } from '@/src/shared/api/axios'
import { getErrorMessage } from '@/src/shared/api/get-error-message'

type PurchaseButtonProps = {
  productId: string
  label: string
}

// Ведемо на оплату у Stripe Checkout (там користувач бачить ціну навіть якщо на сторінці її сховано).
// Без входу спершу відправляємо на сторінку входу.
export function PurchaseButton({ productId, label }: PurchaseButtonProps): ReactElement {
  const router = useRouter()
  const token = useAuthStore((state) => state.accessToken)
  const status = useAuthStore((state) => state.status)
  const [isLoading, setIsLoading] = useState(false)

  const purchase = async () => {
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      setIsLoading(true)
      const res = await api.post(
        '/billing/checkout',
        { productId },
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
      {isLoading ? 'Redirecting to payment...' : label}
    </button>
  )
}
