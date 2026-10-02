import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import { validateBody } from '../../shared/middlewares/helpers.js'
import { checkoutSessionSchema } from './billing.schema.js'
import { billingController } from './billing.controller.js'

const router = Router()

router.post(
  '/checkout',
  authMiddleware.verifyAccess,
  validateBody(checkoutSessionSchema),
  billingController.redirectToCkeckout
)


export default router
