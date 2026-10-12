import { prisma, type DbClient } from '../../shared/database/prisma.js'

const ownerInclude = { owner: { select: { name: true } } }

export const templatesRepo = {
  list: async (params: {
    productId: string
    status: 'active' | 'archived'
    channel?: string
    ownerUserId?: string
  }) => {
    const templates = await prisma.outreachTemplate.findMany({
      where: {
        productId: params.productId,
        status: params.status,
        // Універсальний шаблон підходить до будь-якого каналу.
        ...(params.channel ? { channel: { in: [params.channel, 'any'] } } : {}),
        ...(params.ownerUserId ? { ownerUserId: params.ownerUserId } : {}),
      },
      include: ownerInclude,
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
      take: 200,
    })
    return templates
  },
  findById: async (productId: string, id: string, db: DbClient = prisma) => {
    const template = await db.outreachTemplate.findFirst({
      where: { id, productId },
      include: ownerInclude,
    })
    return template
  },
  create: async (data: {
    productId: string
    ownerUserId: string
    channel: string
    title: string
    subject: string | null
    body: string
  }) => {
    const template = await prisma.outreachTemplate.create({
      data,
      include: ownerInclude,
    })
    return template
  },
  // Змінює лише якщо версія досі та, яку бачив користувач; інакше повертає false.
  updateIfVersion: async (
    id: string,
    expectedVersion: number,
    data: {
      channel?: string
      title?: string
      subject?: string | null
      body?: string
    }
  ): Promise<boolean> => {
    const { count } = await prisma.outreachTemplate.updateMany({
      where: { id, version: expectedVersion, status: 'active' },
      data: { ...data, version: { increment: 1 } },
    })
    return count === 1
  },
  setStatus: async (id: string, status: 'active' | 'archived') => {
    await prisma.outreachTemplate.update({
      where: { id },
      data: {
        status,
        archivedAt: status === 'archived' ? new Date() : null,
      },
    })
  },
  countEvents: async (templateId: string, db: DbClient = prisma) => {
    return db.outreachEvent.count({ where: { templateId } })
  },
  remove: async (id: string, db: DbClient = prisma) => {
    await db.outreachTemplate.delete({ where: { id } })
  },
}
