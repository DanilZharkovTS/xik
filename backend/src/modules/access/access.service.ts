import { prisma } from '../../shared/database/prisma.js'
import type { TokenPayload } from '../auth/auth.types.js'
import { membershipRepo } from './membership.repo.js'

export const accessService = {
  // Продукти для перемикача: адмін бачить усі, модератор лише свої активні.
  listMyProducts: async ({ id, role }: TokenPayload) => {
    if (role === 'admin') {
      const products = await prisma.product.findMany({
        select: { id: true, slug: true, name: true },
        orderBy: { name: 'asc' },
      })
      return { response: { products } }
    }

    if (role === 'moderator') {
      const products = await membershipRepo.listActiveProducts(id)
      return { response: { products } }
    }

    return { response: { products: [] } }
  },
}
