import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import { validateQuery } from '../../shared/middlewares/helpers.js'
import { reportsController } from './reports.controller.js'
import { reportQuerySchema } from './reports.schema.js'

const router = Router()

// Звіт без привʼязки до продукту (усі продукти) лише для адміна.
router.get(
  '/',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateQuery(reportQuerySchema),
  reportsController.forAdmin
)

export default router
