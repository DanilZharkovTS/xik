import { prisma } from '../../shared/database/prisma.js'
import type { PublicationChannel, PublicationKind } from './normalizers.js'

const authorSelect = { user: { select: { name: true } } }

export const publicationsRepo = {
  create: async (data: {
    productId: string
    userId: string
    channel: PublicationChannel
    publicationKind: PublicationKind
    url: string
    urlNormalized: string
    comment?: string
    occurredAt: Date
  }) => {
    const event = await prisma.outreachEvent.create({
      data: { ...data, type: 'publication' },
      include: authorSelect,
    })
    return event
  },
  findByUrl: async (productId: string, urlNormalized: string) => {
    const event = await prisma.outreachEvent.findFirst({
      where: { productId, urlNormalized, type: 'publication' },
      include: authorSelect,
    })
    return event
  },
  list: async (params: {
    productId: string
    userId?: string
    lastId?: string
    limit: number
  }) => {
    const events = await prisma.outreachEvent.findMany({
      where: {
        productId: params.productId,
        type: 'publication',
        ...(params.userId ? { userId: params.userId } : {}),
      },
      include: authorSelect,
      ...(params.lastId ? { cursor: { id: params.lastId }, skip: 1 } : {}),
      take: params.limit + 1,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    })
    return events
  },
}
