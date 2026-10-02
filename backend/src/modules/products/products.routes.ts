import { Router } from 'express'
import {
  paginate,
  validateBody,
  validateParams,
  validateParamsString,
  validateQuery,
} from '../../shared/middlewares/helpers.js'
import {
  createProductSchema,
  findProductsSchema,
  updateProductSchema,
} from './products.schema.js'
import { productsController } from './products.controller.js'
import { authMiddleware } from '../auth/auth.middleware.js'

const router = Router()

router.post(
  '/',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateBody(createProductSchema),
  productsController.createProduct
)

router.get(
  '/saved',
  authMiddleware.verifyAccess,
  paginate,
  productsController.findSavedProducts
)

router.post(
  '/:productId/save',
  authMiddleware.verifyAccess,
  validateParams('productId'),
  productsController.toggleSavedProduct
)

router.get(
  '/',
  authMiddleware.verifyOptionalAccess,
  validateQuery(findProductsSchema),
  productsController.findProducts
)

router.get(
  '/:slug',
  authMiddleware.verifyOptionalAccess,
  validateParamsString('slug'),
  productsController.findProduct
)

router.patch(
  '/:productId',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateParams('productId'),
  validateBody(updateProductSchema),
  productsController.updateProduct
)

router.delete(
  '/:productId',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateParams('productId'),
  productsController.deleteProduct
)

export default router
