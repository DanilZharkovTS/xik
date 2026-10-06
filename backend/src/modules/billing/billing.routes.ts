import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import {
  validateBody,
  validateParams,
} from '../../shared/middlewares/helpers.js'
import { checkoutSessionSchema } from './billing.schema.js'
import { billingController } from './billing.controller.js'

const router = Router()

router.post(
  '/checkout',
  authMiddleware.verifyAccess,
  validateBody(checkoutSessionSchema),
  billingController.redirectToCkeckout
)

router.delete(
  '/subscriptions/:subscriptionId',
  authMiddleware.verifyAccess,
  validateParams('subscriptionId'),
  billingController.cancelSubscription
)

export default router
