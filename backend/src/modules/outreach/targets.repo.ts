import { randomUUID } from 'node:crypto'
import { prisma, type DbClient } from '../../shared/database/prisma.js'
import type { Channel } from './normalizers.js'

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
        productId_channel_valueNormalized: { productId, channel, valueNormalized },
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
  lockTarget: async (
    productId: string,
    targetId: string,
    db: DbClient
  ) => {
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
  listTargets: async (
    params: {
      productId: string
      ownerUserId?: string
      lastId?: string
      limit: number
    },
    db: DbClient = prisma
  ) => {
    const targets = await db.outreachTarget.findMany({
      where: {
        productId: params.productId,
        ...(params.ownerUserId ? { ownerUserId: params.ownerUserId } : {}),
      },
      include: {
        owner: { select: { id: true, name: true } },
        identifiers: { orderBy: { createdAt: 'asc' } },
      },
      ...(params.lastId ? { cursor: { id: params.lastId }, skip: 1 } : {}),
      // Зайвий запис показує, чи є наступна сторінка.
      take: params.limit + 1,
      orderBy: [{ lastContactedAt: 'desc' }, { id: 'desc' }],
    })
    return targets
  },
}
