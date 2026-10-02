import { isAxiosError } from 'axios'

import { api } from '@/src/shared/api/axios'
import type {
  CheckInput,
  CheckResult,
  OutreachProduct,
  RegisterInput,
  RegisterOutcome,
  TargetDetail,
  TargetsPage,
} from './outreach.types'

// Продукт передається заголовком, але остаточне рішення про доступ ухвалює сервер.
const scoped = (token: string, productId: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'X-Product-Id': productId,
  },
})

export const outreachService = {
  listProducts: async (token: string): Promise<OutreachProduct[]> => {
    const res = await api.get('/me/products', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data.products
  },
  check: async (
    input: CheckInput,
    token: string,
    productId: string,
  ): Promise<CheckResult> => {
    const res = await api.post('/outreach/check', input, scoped(token, productId))
    return res.data
  },
  // 409 тут не помилка: хтось устиг раніше, і ми показуємо, чия це ціль.
  register: async (
    input: RegisterInput,
    token: string,
    productId: string,
  ): Promise<RegisterOutcome> => {
    try {
      const res = await api.post('/outreach/targets', input, scoped(token, productId))
      return { kind: 'created', target: res.data.target }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        return { kind: 'taken', result: err.response.data }
      }
      throw err
    }
  },
  addIdentifier: async (
    targetId: string,
    input: CheckInput,
    token: string,
    productId: string,
  ): Promise<RegisterOutcome> => {
    try {
      const res = await api.post(
        `/outreach/targets/${targetId}/identifiers`,
        input,
        scoped(token, productId),
      )
      return { kind: 'created', target: res.data.target }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409 && err.response.data?.normalized) {
        return { kind: 'taken', result: err.response.data }
      }
      throw err
    }
  },
  listTargets: async (
    token: string,
    productId: string,
    lastId?: string,
  ): Promise<TargetsPage> => {
    const res = await api.get('/outreach/targets', {
      ...scoped(token, productId),
      params: lastId ? { lastId } : undefined,
    })
    return res.data
  },
  getTarget: async (
    targetId: string,
    token: string,
    productId: string,
  ): Promise<TargetDetail> => {
    const res = await api.get(`/outreach/targets/${targetId}`, scoped(token, productId))
    return res.data.target
  },
}
