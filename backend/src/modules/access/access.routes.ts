import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import { accessController } from './access.controller.js'
import { accessMiddleware } from './access.middleware.js'

const router = Router()

router.get(
  '/products',
  authMiddleware.verifyAccess,
  accessController.listMyProducts
)

// Фронтенд питає це після вибору продукту: 200 лише якщо доступ є.
router.get(
  '/context',
  authMiddleware.verifyAccess,
  accessMiddleware.requireProduct,
  accessController.getContext
)

export default router
