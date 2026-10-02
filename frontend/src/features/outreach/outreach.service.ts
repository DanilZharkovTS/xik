import { isAxiosError } from 'axios'

import { api } from '@/src/shared/api/axios'
import type {
  ActivityInput,
  CheckInput,
  CheckResult,
  OutreachProduct,
  PublicationInput,
  PublicationOutcome,
  PublicationsPage,
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
  addActivity: async (
    targetId: string,
    input: ActivityInput,
    token: string,
    productId: string,
  ): Promise<TargetDetail> => {
    const res = await api.post(
      `/outreach/targets/${targetId}/events`,
      input,
      scoped(token, productId),
    )
    return res.data.target
  },
  markDoNotContact: async (
    targetId: string,
    reason: string | undefined,
    token: string,
    productId: string,
  ): Promise<TargetDetail> => {
    const res = await api.post(
      `/outreach/targets/${targetId}/do-not-contact`,
      { reason },
      scoped(token, productId),
    )
    return res.data.target
  },
  release: async (
    targetId: string,
    token: string,
    productId: string,
  ): Promise<TargetDetail> => {
    const res = await api.post(
      `/outreach/targets/${targetId}/release`,
      {},
      scoped(token, productId),
    )
    return res.data.target
  },
  createPublication: async (
    input: PublicationInput,
    token: string,
    productId: string,
  ): Promise<PublicationOutcome> => {
    try {
      const res = await api.post('/outreach/publications', input, scoped(token, productId))
      return { kind: 'created', publication: res.data.publication }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        return { kind: 'duplicate', existing: err.response.data?.existing ?? null }
      }
      throw err
    }
  },
  listPublications: async (
    token: string,
    productId: string,
    lastId?: string,
  ): Promise<PublicationsPage> => {
    const res = await api.get('/outreach/publications', {
      ...scoped(token, productId),
      params: lastId ? { lastId } : undefined,
    })
    return res.data
  },
}
