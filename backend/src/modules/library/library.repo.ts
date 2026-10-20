import { prisma } from '../../shared/database/prisma.js'
import {
  GrantLibraryAccessDto,
  RenewLibraryAccessDto,
} from './library.schema.js'

export const libraryRepo = {
  findById: async (id: string) => {
    return prisma.userLibrary.findUnique({
      where: {
        id,
      },
    })
  },
  updateLibraryItemExpiresAt: async (data: RenewLibraryAccessDto) => {
    const libraryItem = await prisma.userLibrary.update({
      where: {
        stripeSubscriptionId: data.subscriptionId,
      },
      data: {
        accessExpiresAt: data.accessExpiresAt,
      },
    })
    return libraryItem
  },
  restoreCanceledById: async (id: string) => {
    return prisma.userLibrary.update({
      where: {
        id,
        canceledAt: { not: null },
      },
      data: {
        canceledAt: null,
      },
    })
  },
  cancelById: async (id: string) => {
    const libraryItem = await prisma.userLibrary.update({
      where: {
        id,
      },
      data: {
        canceledAt: new Date(),
      },
    })
    return libraryItem
  },
  cancelBySubscription: async (subscriptionId: string) => {
    const libraryItem = await prisma.userLibrary.update({
      where: {
        stripeSubscriptionId: subscriptionId,
        canceledAt: null,
      },
      data: {
        canceledAt: new Date(),
      },
    })
    return libraryItem
  },
}
