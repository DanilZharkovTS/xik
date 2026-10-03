import { prisma } from '../../shared/database/prisma.js'
import type { UpdateAccountDto } from './account.schema.js'

export const accountRepo = {
  findProfile: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, locale: true, createdAt: true },
    }),

  update: (id: string, data: UpdateAccountDto) =>
    prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, locale: true, createdAt: true },
    }),

  // Покупки з продуктами. Архівний продукт лишається в історії, бо за нього могли платити.
  findLibrary: (userId: string) =>
    prisma.userLibrary.findMany({
      where: { userId },
      include: { product: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    }),

  // Збережені: архівні продукти з вітрини зникли, тож і тут не показуються.
  findSaved: (userId: string) =>
    prisma.savedProduct.findMany({
      where: { userId, product: { archivedAt: null } },
      include: { product: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    }),
}
