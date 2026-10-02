'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

import useAuthStore from '@/src/features/auth/store'
import { getErrorMessage } from '@/src/shared/api/get-error-message'
import { outreachService } from './outreach.service'
import { useOutreachStore } from './outreach-store'

// Токен і вибраний продукт для запитів журналу + обробка втрати доступу.
export function useOutreachContext() {
  const token = useAuthStore((state) => state.accessToken)
  const productId = useOutreachStore((state) => state.selectedProductId)
  const setProducts = useOutreachStore((state) => state.setProducts)

  // Якщо адмін забрав продукт, сервер відповідає 403: оновлюємо список, і продукт зникає зі списку.
  const handleError = useCallback(
    async (err: unknown) => {
      toast.error(getErrorMessage(err))

      if (token && isAxiosError(err) && err.response?.status === 403) {
        try {
          setProducts(await outreachService.listProducts(token))
        } catch {
          // лишається повідомлення про помилку
        }
      }
    },
    [token, setProducts],
  )

  return { token, productId, handleError }
}
