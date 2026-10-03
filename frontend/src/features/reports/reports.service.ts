import { api } from '@/src/shared/api/axios'
import { EVENT_TYPES } from './reports.types'
import type { Report, ReportQuery } from './reports.types'

const toParams = (query: ReportQuery) => ({
  period: query.period,
  date: query.date,
  from: query.from,
  to: query.to,
  // Усі типи означають "без фільтра": URL лишається короткий.
  types: query.types.length === EVENT_TYPES.length ? undefined : query.types.join(','),
  userId: query.userId,
  productId: query.productId,
})

export const reportsService = {
  // Модератор: звіт по вибраному продукту, лише власні події.
  forProduct: async (
    query: Omit<ReportQuery, 'productId'>,
    token: string,
    productId: string,
  ): Promise<Report> => {
    const res = await api.get('/outreach/reports', {
      params: toParams(query),
      headers: { Authorization: `Bearer ${token}`, 'X-Product-Id': productId },
    })
    return res.data
  },
  // Адмін: усі продукти (без productId) або один.
  forAdmin: async (query: ReportQuery, token: string): Promise<Report> => {
    const res = await api.get('/reports', {
      params: toParams(query),
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
}
