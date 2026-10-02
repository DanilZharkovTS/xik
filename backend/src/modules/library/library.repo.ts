import { prisma } from '../../shared/database/prisma.js'
import {
  GrantLibraryAccessDto,
  RenewLibraryAccessDto,
} from './library.schema.js'

export const libraryRepo = {
  addLibraryItem: async (data: GrantLibraryAccessDto) => {
    const libraryItem = await prisma.userLibrary.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        subscriptionId: data.subscriptionId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        accessExpiresAt: data.accessExpiresAt,
      },
    })
    return libraryItem
  },
  updateLibraryItemExpiresAt: async (data: RenewLibraryAccessDto) => {
    const libraryItem = await prisma.userLibrary.update({
      where: {
        subscriptionId: data.subscriptionId,
      },
      data: {
        accessExpiresAt: data.accessExpiresAt,
      },
    })
    return libraryItem
  },
  cancelBySubscription: async (subscriptionId: string) => {
    const libraryItem = await prisma.userLibrary.update({
      where: {
        subscriptionId,
        canceledAt: null,
      },
      data: {
        canceledAt: new Date(),
      },
    })
    return libraryItem
  },
}
