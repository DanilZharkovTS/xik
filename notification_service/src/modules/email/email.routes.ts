import { Router } from 'express'
import { emailController } from './email.controller'
import { validateBody } from '../../shared/middlewares/helpers'
import {
  cancelSubscriptionEmailSchema,
  deleteSubscriptionEmailSchema,
  paymentAttemptFailedEmailSchema,
  sendSigningKeyEmailSchema,
  subscriptionStartedEmailSchema,
} from './email.schema'

const router = Router()

router.post(
  '/signing-key',
  validateBody(sendSigningKeyEmailSchema),
  emailController.sendSigningKey
)

router.post(
  '/cancel-subscription',
  validateBody(cancelSubscriptionEmailSchema),
  emailController.sendCanceledSubscription
)

router.post(
  '/delete-subscription',
  validateBody(deleteSubscriptionEmailSchema),
  emailController.sendDeletedSubscription
)

router.post(
  '/payment-attempt-failed',
  validateBody(paymentAttemptFailedEmailSchema),
  emailController.sendPaymentAttemptFailed
)

router.post(
  '/subscription-started',
  validateBody(subscriptionStartedEmailSchema),
  emailController.sendSubscriptionStarted
)

export default router
