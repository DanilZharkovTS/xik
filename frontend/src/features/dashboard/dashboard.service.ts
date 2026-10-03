import { adminProductsService } from '@/src/features/admin-products/admin-products.service'
import { outreachService } from '@/src/features/outreach/outreach.service'
import { reportsService } from '@/src/features/reports/reports.service'
import { EVENT_TYPES } from '@/src/features/reports/reports.types'
import type { NamedRow, ReportCounts } from '@/src/features/reports/reports.types'

export interface CatalogHealth {
  total: number
  inStripe: number
  hiddenPrice: number
}

export interface DashboardData {
  week: ReportCounts
  periodLabel: { from: string; to: string }
  byModerator: NamedRow[]
  byProduct: NamedRow[]
  catalog: CatalogHealth | null
}

const EMPTY: ReportCounts = { first: 0, repeat: 0, reply: 0, publication: 0, contacts: 0, total: 0 }

const sum = (rows: ReportCounts[]): ReportCounts =>
  rows.reduce(
    (acc, row) => ({
      first: acc.first + row.first,
      repeat: acc.repeat + row.repeat,
      reply: acc.reply + row.reply,
      publication: acc.publication + row.publication,
      contacts: acc.contacts + row.contacts,
      total: acc.total + row.total,
    }),
    EMPTY,
  )

const QUERY = { period: 'week', types: [...EVENT_TYPES] } as const

// Адмін: усі продукти разом і стан каталогу. Модератор: сума власних подій по його продуктах.
export const dashboardService = {
  load: async (token: string, isAdmin: boolean): Promise<DashboardData> => {
    if (isAdmin) {
      const [report, products] = await Promise.all([
        reportsService.forAdmin({ ...QUERY, types: [...EVENT_TYPES] }, token),
        adminProductsService.list({ state: 'active' }, token),
      ])

      return {
        week: report.totals,
        periodLabel: { from: report.range.from, to: report.range.to },
        byModerator: (report.byModerator ?? []).filter((row) => row.total > 0).slice(0, 5),
        byProduct: (report.byProduct ?? []).filter((row) => row.total > 0).slice(0, 5),
        catalog: {
          total: products.length,
          inStripe: products.filter((product) => product.isStripeLinked).length,
          hiddenPrice: products.filter((product) => !product.showPrice).length,
        },
      }
    }

    const products = await outreachService.listProducts(token)
    const reports = await Promise.all(
      products.map((product) =>
        reportsService.forProduct({ ...QUERY, types: [...EVENT_TYPES] }, token, product.id),
      ),
    )

    return {
      week: sum(reports.map((report) => report.totals)),
      periodLabel: reports[0]
        ? { from: reports[0].range.from, to: reports[0].range.to }
        : { from: '', to: '' },
      byModerator: [],
      byProduct: products
        .map((product, index) => ({ id: product.id, name: product.name, ...reports[index].totals }))
        .filter((row) => row.total > 0)
        .slice(0, 5),
      catalog: null,
    }
  },
}
