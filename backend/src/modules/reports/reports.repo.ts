import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../../shared/database/prisma.js'
import type { ReportEventType } from './reports.schema.js'

export interface ReportFilter {
  from: string
  to: string
  timeZone: string
  types: readonly ReportEventType[]
  productId?: string
  userId?: string
}

interface CountRow {
  count: number
}

// Колонка occurredAt це timestamp без пояса зі значеннями в UTC. Межі днів рахуємо в налаштованому
// поясі: початок локальної доби переводимо назад у UTC і порівнюємо з колонкою.
const where = (filter: ReportFilter): Prisma.Sql => {
  const conditions = [
    Prisma.sql`"type"::text IN (${Prisma.join([...filter.types])})`,
    Prisma.sql`"occurredAt" >= ((${filter.from}::timestamp AT TIME ZONE ${filter.timeZone}) AT TIME ZONE 'UTC')`,
    Prisma.sql`"occurredAt" < ((${filter.to}::timestamp AT TIME ZONE ${filter.timeZone}) AT TIME ZONE 'UTC')`,
  ]

  if (filter.productId)
    conditions.push(Prisma.sql`"productId" = ${filter.productId}`)
  if (filter.userId) conditions.push(Prisma.sql`"userId" = ${filter.userId}`)

  return Prisma.join(conditions, ' AND ')
}

export const reportsRepo = {
  countsByBucketAndType: (filter: ReportFilter, granularity: 'day' | 'month') =>
    prisma.$queryRaw<(CountRow & { bucket: string; type: ReportEventType })[]>`
      SELECT to_char(
               date_trunc(${granularity}, ("occurredAt" AT TIME ZONE 'UTC') AT TIME ZONE ${filter.timeZone}),
               'YYYY-MM-DD'
             ) AS "bucket",
             "type"::text AS "type",
             COUNT(*)::int AS "count"
      FROM "OutreachEvent"
      WHERE ${where(filter)}
      GROUP BY 1, 2
    `,
  countsByChannelAndType: (filter: ReportFilter) =>
    prisma.$queryRaw<
      (CountRow & { channel: string | null; type: ReportEventType })[]
    >`
      SELECT "channel", "type"::text AS "type", COUNT(*)::int AS "count"
      FROM "OutreachEvent"
      WHERE ${where(filter)}
      GROUP BY 1, 2
    `,
  countsByModeratorAndType: (filter: ReportFilter) =>
    prisma.$queryRaw<
      (CountRow & { userId: string; name: string; type: ReportEventType })[]
    >`
      SELECT e."userId" AS "userId", u."name" AS "name", e."type"::text AS "type", COUNT(*)::int AS "count"
      FROM "OutreachEvent" e
      JOIN "User" u ON u."id" = e."userId"
      WHERE ${where(filter)}
      GROUP BY 1, 2, 3
    `,
  countsByProductAndType: (filter: ReportFilter) =>
    prisma.$queryRaw<
      (CountRow & { productId: string; name: string; type: ReportEventType })[]
    >`
      SELECT e."productId" AS "productId", p."name" AS "name", e."type"::text AS "type", COUNT(*)::int AS "count"
      FROM "OutreachEvent" e
      JOIN "Product" p ON p."id" = e."productId"
      WHERE ${where(filter)}
      GROUP BY 1, 2, 3
    `,
}
