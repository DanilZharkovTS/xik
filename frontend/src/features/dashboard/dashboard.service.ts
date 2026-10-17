import { adminBlogService } from '@/src/features/admin-blog/admin-blog.service'
import { adminProductsService } from '@/src/features/admin-products/admin-products.service'
import { outreachService } from '@/src/features/outreach/outreach.service'
import { shiftAnchor } from '@/src/features/reports/report-dates'
import { reportsService } from '@/src/features/reports/reports.service'
import { EVENT_TYPES } from '@/src/features/reports/reports.types'
import type { NamedRow, Report, ReportCounts } from '@/src/features/reports/reports.types'
import { teamService } from '@/src/features/team/team.service'

export type DashboardPeriod = 'week' | 'month'

export interface CatalogHealth {
  total: number
  inStripe: number
  hiddenPrice: number
}

// Що адміну варто зробити: кожен пункт веде туди, де це виправляється.
export interface Attention {
  productsNotInStripe: number
  moderatorsWithoutProducts: { id: string; name: string }[]
  scheduledArticles: number
  draftArticles: number
}

export interface DashboardData {
  current: ReportCounts
  previous: ReportCounts
  periodLabel: { from: string; to: string }
  byModerator: NamedRow[]
  byProduct: NamedRow[]
  catalog: CatalogHealth | null
  attention: Attention | null
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

const query = (period: DashboardPeriod, date?: string) => ({ period, date, types: [...EVENT_TYPES] })

// Попередній період рахується від початку поточного: той самий тиждень чи місяць, зсунутий назад.
const previousDate = (period: DashboardPeriod, report: Report): string =>
  shiftAnchor(period, report.range.from, -1)

const top = (rows: NamedRow[] | undefined): NamedRow[] => (rows ?? []).filter((row) => row.total > 0).slice(0, 5)

// Адмін: усі продукти разом, стан каталогу і що потребує уваги.
// Модератор: сума власних подій по його продуктах.
export const dashboardService = {
  load: async (token: string, isAdmin: boolean, period: DashboardPeriod): Promise<DashboardData> => {
    if (isAdmin) {
      const [report, products, moderators, scheduled, drafts] = await Promise.all([
        reportsService.forAdmin(query(period), token),
        adminProductsService.list({ state: 'active' }, token),
        teamService.listModerators(token),
        adminBlogService.list({ state: 'scheduled' }, token),
        adminBlogService.list({ state: 'draft' }, token),
      ])
      const previous = await reportsService.forAdmin(query(period, previousDate(period, report)), token)

      return {
        current: report.totals,
        previous: previous.totals,
        periodLabel: { from: report.range.from, to: report.range.to },
        byModerator: top(report.byModerator),
        byProduct: top(report.byProduct),
        catalog: {
          total: products.length,
          inStripe: products.filter((product) => product.isStripeLinked).length,
          hiddenPrice: products.filter((product) => !product.showPrice).length,
        },
        attention: {
          productsNotInStripe: products.filter((product) => !product.isStripeLinked).length,
          moderatorsWithoutProducts: moderators
            .filter((moderator) => moderator.deactivatedAt === null && moderator.products.length === 0)
            .map((moderator) => ({ id: moderator.id, name: moderator.name })),
          scheduledArticles: scheduled.length,
          draftArticles: drafts.length,
        },
      }
    }

    const products = await outreachService.listProducts(token)
    const reports = await Promise.all(
      products.map((product) => reportsService.forProduct(query(period), token, product.id)),
    )
    const previous = reports[0]
      ? await Promise.all(
          products.map((product) =>
            reportsService.forProduct(query(period, previousDate(period, reports[0])), token, product.id),
          ),
        )
      : []

    return {
      current: sum(reports.map((report) => report.totals)),
      previous: sum(previous.map((report) => report.totals)),
      periodLabel: reports[0] ? { from: reports[0].range.from, to: reports[0].range.to } : { from: '', to: '' },
      byModerator: [],
      byProduct: products
        .map((product, index) => ({ id: product.id, name: product.name, ...reports[index].totals }))
        .filter((row) => row.total > 0)
        .slice(0, 5),
      catalog: null,
      attention: null,
    }
  },
}
