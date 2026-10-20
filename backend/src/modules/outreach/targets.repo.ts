import { randomUUID } from 'node:crypto'
import { Prisma } from '../../generated/prisma/client.js'
import { prisma, type DbClient } from '../../shared/database/prisma.js'
import type { Channel } from './normalizers.js'
import type { TargetState } from './targets.schema.js'

export interface TargetFilter {
  productId: string
  ownerUserId?: string
  state: TargetState
  channel?: Channel
  q?: string
  followUpBefore: Date
}

// Умови списку: стан роботи, власник, канал і пошук за назвою або ідентифікатором.
const targetWhere = (filter: TargetFilter): Prisma.OutreachTargetWhereInput => {
  const and: Prisma.OutreachTargetWhereInput[] = [
    { productId: filter.productId },
  ]
  const fields = prisma.outreachTarget.fields

  if (filter.ownerUserId) and.push({ ownerUserId: filter.ownerUserId })
  if (filter.channel)
    and.push({ identifiers: { some: { channel: filter.channel } } })

  if (filter.q) {
    and.push({
      OR: [
        { displayName: { contains: filter.q, mode: 'insensitive' } },
        {
          identifiers: {
            some: {
              valueNormalized: {
                contains: filter.q.toLowerCase().replace(/^@/, ''),
              },
            },
          },
        },
      ],
    })
  }

  switch (filter.state) {
    case 'awaiting':
      and.push({ status: 'active', lastReplyAt: null })
      break
    case 'followUp':
      and.push({
        status: 'active',
        lastReplyAt: null,
        lastContactedAt: { lt: filter.followUpBefore },
      })
      break
    case 'needsAnswer':
      // Відповідь новіша за наш останній контакт: м'яч на нашому боці.
      and.push({
        status: 'active',
        lastReplyAt: { not: null, gte: fields.lastContactedAt },
      })
      break
    case 'replied':
      and.push({ lastReplyAt: { not: null } })
      break
    case 'doNotContact':
      and.push({ status: 'do_not_contact' })
      break
  }

  return { AND: and }
}

// "Закинуті" показуємо від найстаріших, решту від найсвіжіших.
const targetOrder = (
  state: TargetState
): Prisma.OutreachTargetOrderByWithRelationInput[] =>
  state === 'followUp'
    ? [{ lastContactedAt: 'asc' }, { id: 'asc' }]
    : [{ lastContactedAt: 'desc' }, { id: 'desc' }]

export interface OwnerSummaryRow {
  ownerUserId: string
  name: string
  total: number
  awaiting: number
  followUp: number
  needsAnswer: number
  replied: number
  doNotContact: number
}

const EVENTS_LIMIT = 100

const detailInclude = {
  owner: { select: { id: true, name: true } },
  identifiers: { orderBy: { createdAt: 'asc' as const } },
  events: {
    orderBy: { occurredAt: 'desc' as const },
    take: EVENTS_LIMIT,
    include: {
      user: { select: { name: true } },
      template: { select: { id: true, title: true } },
    },
  },
}

export const targetsRepo = {
  findByIdentifier: async (
    productId: string,
    channel: Channel,
    valueNormalized: string,
    db: DbClient = prisma
  ) => {
    const identifier = await db.outreachIdentifier.findUnique({
      where: {
        productId_channel_valueNormalized: {
          productId,
          channel,
          valueNormalized,
        },
      },
      select: {
        target: {
          include: { owner: { select: { id: true, name: true } } },
        },
      },
    })
    return identifier?.target ?? null
  },
  findDetailById: async (
    productId: string,
    targetId: string,
    db: DbClient = prisma
  ) => {
    const target = await db.outreachTarget.findFirst({
      where: { id: targetId, productId },
      include: detailInclude,
    })
    return target
  },
  createTarget: async (
    data: {
      productId: string
      displayName: string
      ownerUserId: string
      firstContactedAt: Date
    },
    db: DbClient = prisma
  ) => {
    const target = await db.outreachTarget.create({
      data: { ...data, lastContactedAt: data.firstContactedAt },
    })
    return target
  },
  // Атомарне зайняття ідентифікатора: при гонці другий отримує false, а не помилку.
  insertIdentifierIfFree: async (
    data: {
      targetId: string
      productId: string
      channel: Channel
      valueNormalized: string
    },
    db: DbClient = prisma
  ): Promise<boolean> => {
    const rows = await db.$queryRaw<{ id: string }[]>`
      INSERT INTO "OutreachIdentifier" ("id", "targetId", "productId", "channel", "valueNormalized")
      VALUES (${randomUUID()}, ${data.targetId}, ${data.productId}, ${data.channel}, ${data.valueNormalized})
      ON CONFLICT ("productId", "channel", "valueNormalized") DO NOTHING
      RETURNING "id"
    `
    return rows.length > 0
  },
  createEvent: async (
    data: {
      productId: string
      targetId: string
      userId: string
      type: 'first' | 'repeat' | 'reply' | 'status'
      channel?: Channel
      url?: string
      comment?: string
      templateId?: string
      templateVersion?: number
      occurredAt: Date
    },
    db: DbClient = prisma
  ) => {
    await db.outreachEvent.create({ data })
  },
  // Блокує рядок цілі до кінця транзакції: зміна статусу й додавання події не перегоняють одне одного.
  lockTarget: async (productId: string, targetId: string, db: DbClient) => {
    const rows = await db.$queryRaw<
      { id: string; ownerUserId: string; status: 'active' | 'do_not_contact' }[]
    >`
      SELECT "id", "ownerUserId", "status"
      FROM "OutreachTarget"
      WHERE "id" = ${targetId} AND "productId" = ${productId}
      FOR UPDATE
    `
    return rows[0] ?? null
  },
  setStatus: async (
    targetId: string,
    status: 'active' | 'do_not_contact',
    statusReason: string | null,
    db: DbClient = prisma
  ) => {
    await db.outreachTarget.update({
      where: { id: targetId },
      data: { status, statusReason },
    })
  },
  // Останній контакт лише рухається вперед, навіть якщо подію внесли заднім числом.
  touchLastContacted: async (
    targetId: string,
    at: Date,
    db: DbClient = prisma
  ) => {
    await db.outreachTarget.updateMany({
      where: {
        id: targetId,
        OR: [{ lastContactedAt: null }, { lastContactedAt: { lt: at } }],
      },
      data: { lastContactedAt: at },
    })
  },
  // Відповідь людини: остання дата відповіді лише рухається вперед.
  touchLastReply: async (targetId: string, at: Date, db: DbClient = prisma) => {
    await db.outreachTarget.updateMany({
      where: {
        id: targetId,
        OR: [{ lastReplyAt: null }, { lastReplyAt: { lt: at } }],
      },
      data: { lastReplyAt: at },
    })
  },
  // Канал першого ідентифікатора: ним позначається подія, якщо модератор канал не вибрав.
  primaryChannel: async (targetId: string, db: DbClient = prisma) => {
    const identifier = await db.outreachIdentifier.findFirst({
      where: { targetId },
      orderBy: { createdAt: 'asc' },
      select: { channel: true },
    })
    return (identifier?.channel ?? undefined) as Channel | undefined
  },
  listTargets: async (
    params: TargetFilter & { lastId?: string; limit: number },
    db: DbClient = prisma
  ) => {
    const targets = await db.outreachTarget.findMany({
      where: targetWhere(params),
      include: {
        owner: { select: { id: true, name: true } },
        identifiers: { orderBy: { createdAt: 'asc' } },
      },
      ...(params.lastId ? { cursor: { id: params.lastId }, skip: 1 } : {}),
      // Зайвий запис показує, чи є наступна сторінка.
      take: params.limit + 1,
      orderBy: targetOrder(params.state),
    })
    return targets
  },
  // Вивантаження в CSV: ті самі фільтри, без сторінок, з верхньою межею.
  exportTargets: async (filter: TargetFilter, limit: number) =>
    prisma.outreachTarget.findMany({
      where: targetWhere(filter),
      include: {
        owner: { select: { id: true, name: true } },
        identifiers: { orderBy: { createdAt: 'asc' } },
        _count: { select: { events: { where: { type: 'reply' } } } },
      },
      take: limit,
      orderBy: targetOrder(filter.state),
    }),
  // Де саме висять справи: модератор × продукт, лише рядки, де щось потребує дії.
  actionItems: async (params: { productId?: string; followUpBefore: Date }) => {
    const conditions: Prisma.Sql[] = [Prisma.sql`t."status" = 'active'`]
    if (params.productId)
      conditions.push(Prisma.sql`t."productId" = ${params.productId}`)

    return prisma.$queryRaw<
      {
        userId: string
        name: string
        productId: string
        productName: string
        followUp: number
        needsAnswer: number
      }[]
    >`
      SELECT * FROM (
        SELECT t."ownerUserId" AS "userId",
               u."name" AS "name",
               t."productId" AS "productId",
               p."name" AS "productName",
               (COUNT(*) FILTER (WHERE t."lastReplyAt" IS NULL AND t."lastContactedAt" < ${params.followUpBefore}))::int AS "followUp",
               (COUNT(*) FILTER (WHERE t."lastReplyAt" IS NOT NULL AND t."lastReplyAt" >= t."lastContactedAt"))::int AS "needsAnswer"
        FROM "OutreachTarget" t
        JOIN "User" u ON u."id" = t."ownerUserId"
        JOIN "Product" p ON p."id" = t."productId"
        WHERE ${Prisma.join(conditions, ' AND ')}
        GROUP BY 1, 2, 3, 4
      ) rows
      WHERE "followUp" > 0 OR "needsAnswer" > 0
      ORDER BY "followUp" + "needsAnswer" DESC
      LIMIT 50
    `
  },
  // Скільки цілей у якому стані, по власниках. Без продукту рахує всі продукти (для адміна).
  summaryByOwner: async (params: {
    productId?: string
    ownerUserId?: string
    followUpBefore: Date
  }) => {
    const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`]
    if (params.productId)
      conditions.push(Prisma.sql`t."productId" = ${params.productId}`)
    if (params.ownerUserId)
      conditions.push(Prisma.sql`t."ownerUserId" = ${params.ownerUserId}`)

    return prisma.$queryRaw<OwnerSummaryRow[]>`
      SELECT t."ownerUserId" AS "ownerUserId",
             u."name" AS "name",
             COUNT(*)::int AS "total",
             (COUNT(*) FILTER (WHERE t."status" = 'active' AND t."lastReplyAt" IS NULL))::int AS "awaiting",
             (COUNT(*) FILTER (WHERE t."status" = 'active' AND t."lastReplyAt" IS NULL
                                 AND t."lastContactedAt" < ${params.followUpBefore}))::int AS "followUp",
             (COUNT(*) FILTER (WHERE t."status" = 'active' AND t."lastReplyAt" IS NOT NULL
                                 AND t."lastReplyAt" >= t."lastContactedAt"))::int AS "needsAnswer",
             (COUNT(*) FILTER (WHERE t."lastReplyAt" IS NOT NULL))::int AS "replied",
             (COUNT(*) FILTER (WHERE t."status" = 'do_not_contact'))::int AS "doNotContact"
      FROM "OutreachTarget" t
      JOIN "User" u ON u."id" = t."ownerUserId"
      WHERE ${Prisma.join(conditions, ' AND ')}
      GROUP BY 1, 2
      ORDER BY "followUp" DESC, "total" DESC
    `
  },
}
