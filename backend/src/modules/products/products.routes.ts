import { Router } from 'express'
import {
  paginate,
  validateBody,
  validateParams,
  validateParamsString,
  validateQuery,
} from '../../shared/middlewares/helpers.js'
import {
  adminListSchema,
  catalogQuerySchema,
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

// Блоки сайту: продукти й агенти, без пагінації.
router.get(
  '/catalog',
  validateQuery(catalogQuerySchema),
  productsController.listCatalog
)

// Адмін-список разом із архівними й Stripe-привʼязкою.
router.get(
  '/admin',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateQuery(adminListSchema),
  productsController.listForAdmin
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

// Видалення це архівування; остаточно продукти не видаляються.
router.delete(
  '/:productId',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateParams('productId'),
  productsController.archiveProduct
)

router.post(
  '/:productId/restore',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateParams('productId'),
  productsController.restoreProduct
)

router.post(
  '/:productId/stripe-sync',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateParams('productId'),
  productsController.syncWithStripe
)

export default router
