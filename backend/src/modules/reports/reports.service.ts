import { ApiError } from '../../shared/utils/ApiError.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { prisma } from '../../shared/database/prisma.js'
import { bucketsOf, resolveRange, todayIn } from './reports.range.js'
import { reportsRepo, type ReportFilter } from './reports.repo.js'
import { REPORT_EVENT_TYPES, type ReportEventType } from './reports.schema.js'
import type { ReportQueryDto } from './reports.schema.js'

export const DEFAULT_TIME_ZONE = 'Europe/Kyiv'

// Один часовий пояс на застосунок; помилку в назві ловимо одразу, а не мовчки рахуємо по UTC.
export const reportTimeZone = (): string => {
  const timeZone = process.env.REPORT_TIMEZONE || DEFAULT_TIME_ZONE

  try {
    new Intl.DateTimeFormat('en', { timeZone })
  } catch {
    throw new Error(`Invalid REPORT_TIMEZONE: ${timeZone}`)
  }

  return timeZone
}

type Counts = Record<ReportEventType, number>

const emptyCounts = (): Counts => ({
  first: 0,
  repeat: 0,
  reply: 0,
  publication: 0,
})

const sum = (counts: Counts): number =>
  REPORT_EVENT_TYPES.reduce((total, type) => total + counts[type], 0)

// Звернення це перші й повторні; відповіді та публікації рахуються окремо.
const withTotals = (counts: Counts) => ({
  ...counts,
  contacts: counts.first + counts.repeat,
  total: sum(counts),
})

const byTotalDesc = <T extends { total: number }>(
  rows: T[],
  label: (row: T) => string
) => rows.sort((a, b) => b.total - a.total || label(a).localeCompare(label(b)))

interface Scope {
  // Продукт, до якого звужено звіт; без нього адмін бачить усі продукти.
  productId?: string
  userId?: string
  includeModerators: boolean
  includeProducts: boolean
}

export const reportsService = {
  build: async (
    query: ReportQueryDto,
    scope: Scope,
    now: Date = new Date()
  ) => {
    const timeZone = reportTimeZone()
    const date = query.date ?? todayIn(timeZone, now)
    const range = resolveRange({
      period: query.period,
      date,
      from: query.from,
      to: query.to,
    })

    const filter: ReportFilter = {
      from: range.from,
      to: range.to,
      timeZone,
      types: query.types,
      productId: scope.productId,
      userId: scope.userId,
    }

    const [bucketRows, channelRows, moderatorRows, productRows] =
      await Promise.all([
        reportsRepo.countsByBucketAndType(filter, range.granularity),
        reportsRepo.countsByChannelAndType(filter),
        scope.includeModerators
          ? reportsRepo.countsByModeratorAndType(filter)
          : [],
        scope.includeProducts ? reportsRepo.countsByProductAndType(filter) : [],
      ])

    const totals = emptyCounts()
    const series = new Map(
      bucketsOf(range).map((bucket) => [bucket, emptyCounts()])
    )

    for (const row of bucketRows) {
      totals[row.type] += row.count
      const bucket = series.get(row.bucket)
      if (bucket) bucket[row.type] += row.count
    }

    const channels = new Map<string, Counts>()
    for (const row of channelRows) {
      const key = row.channel ?? 'unspecified'
      const counts = channels.get(key) ?? emptyCounts()
      counts[row.type] += row.count
      channels.set(key, counts)
    }

    const group = (
      rows: { id: string; name: string; type: ReportEventType; count: number }[]
    ) => {
      const groups = new Map<string, { name: string; counts: Counts }>()

      for (const row of rows) {
        const entry = groups.get(row.id) ?? {
          name: row.name,
          counts: emptyCounts(),
        }
        entry.counts[row.type] += row.count
        groups.set(row.id, entry)
      }

      return [...groups.entries()].map(([id, { name, counts }]) => ({
        id,
        name,
        ...withTotals(counts),
      }))
    }

    return {
      response: {
        range: {
          period: query.period,
          from: range.from,
          // Для відображення: останній день включно.
          to: new Date(new Date(`${range.to}T00:00:00Z`).getTime() - 86_400_000)
            .toISOString()
            .slice(0, 10),
          days: range.days,
          granularity: range.granularity,
          timeZone,
        },
        totals: withTotals(totals),
        series: [...series.entries()].map(([bucket, counts]) => ({
          bucket,
          ...withTotals(counts),
        })),
        byChannel: byTotalDesc(
          [...channels.entries()].map(([channel, counts]) => ({
            channel,
            ...withTotals(counts),
          })),
          (row) => row.channel
        ),
        byModerator: scope.includeModerators
          ? byTotalDesc(
              group(moderatorRows.map((row) => ({ ...row, id: row.userId }))),
              (row) => row.name
            )
          : undefined,
        byProduct: scope.includeProducts
          ? byTotalDesc(
              group(productRows.map((row) => ({ ...row, id: row.productId }))),
              (row) => row.name
            )
          : undefined,
      },
    }
  },
  // Для звіту по продукту: адмін може звузити до одного модератора, модератор бачить лише своє.
  forProduct: async (
    actor: TokenPayload,
    productId: string,
    query: ReportQueryDto
  ) => {
    const isAdmin = actor.role === 'admin'

    return reportsService.build(query, {
      productId,
      userId: isAdmin ? query.userId : actor.id,
      includeModerators: isAdmin,
      includeProducts: false,
    })
  },
  // Для адміна поза продуктом: усі продукти або один, якщо вказано productId.
  forAdmin: async (query: ReportQueryDto) => {
    if (query.productId) {
      const product = await prisma.product.findUnique({
        where: { id: query.productId },
        select: { id: true },
      })

      if (!product)
        throw ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
    }

    return reportsService.build(query, {
      productId: query.productId,
      userId: query.userId,
      includeModerators: true,
      includeProducts: !query.productId,
    })
  },
}
