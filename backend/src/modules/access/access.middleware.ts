import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { membershipRepo } from './membership.repo.js'

export const accessMiddleware = {
  // Продукт запиту визначає сервер: id із заголовка приймається лише після перевірки
  // членства. Невідомий продукт — 404, чужий — 403. Вимагає попереднього verifyAccess.
  requireProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.headers['x-product-id']

      if (typeof productId !== 'string' || !productId) {
        throw ApiError(400, 'PRODUCT_REQUIRED', 'Product is not selected')
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      })

      if (!product) {
        throw ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
      }

      const { id: userId, role } = req.user

      if (role !== 'admin') {
        const membership =
          role === 'moderator'
            ? await membershipRepo.findActive(userId, product.id)
            : null

        if (!membership) {
          throw ApiError(403, 'FORBIDDEN', 'Access to this product is denied')
        }
      }

      req.product = { id: product.id }
      next()
    } catch (err) {
      next(err)
    }
  },
}
