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
  Template,
  TemplateInput,
  TemplateStatus,
  TemplateUpdateOutcome,
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
  listTemplates: async (
    token: string,
    productId: string,
    params: { status?: TemplateStatus; channel?: string } = {},
  ): Promise<Template[]> => {
    const res = await api.get('/outreach/templates', {
      ...scoped(token, productId),
      params,
    })
    return res.data.templates
  },
  createTemplate: async (
    input: TemplateInput,
    token: string,
    productId: string,
  ): Promise<Template> => {
    const res = await api.post('/outreach/templates', input, scoped(token, productId))
    return res.data.template
  },
  // 409 STALE_VERSION: шаблон змінили в іншій вкладці, віддаємо актуальний, щоб не затерти правки.
  updateTemplate: async (
    id: string,
    input: Omit<Partial<TemplateInput>, 'subject'> & {
      expectedVersion: number
      subject?: string | null
    },
    token: string,
    productId: string,
  ): Promise<TemplateUpdateOutcome> => {
    try {
      const res = await api.patch(`/outreach/templates/${id}`, input, scoped(token, productId))
      return { kind: 'updated', template: res.data.template }
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.code === 'STALE_VERSION') {
        return { kind: 'stale', template: err.response.data.template ?? null }
      }
      throw err
    }
  },
  templateAction: async (
    id: string,
    action: 'archive' | 'restore' | 'duplicate',
    token: string,
    productId: string,
  ): Promise<Template> => {
    const res = await api.post(
      `/outreach/templates/${id}/${action}`,
      {},
      scoped(token, productId),
    )
    return res.data.template
  },
  deleteTemplate: async (id: string, token: string, productId: string): Promise<void> => {
    await api.delete(`/outreach/templates/${id}`, scoped(token, productId))
  },
}
