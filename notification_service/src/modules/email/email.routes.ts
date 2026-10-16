import { Router } from 'express'
import { emailController } from './email.controller'
import { validateBody } from '../../shared/middlewares/helpers'
import {
  cancelSubscriptionEmailSchema,
  deleteSubscriptionEmailSchema,
  passwordChangedEmailSchema,
  passwordResetEmailSchema,
  paymentAttemptFailedEmailSchema,
  sendDeviceKeyEmailSchema,
  subscriptionStartedEmailSchema,
} from './email.schema'

const router = Router()

router.post(
  '/send-device-key',
  validateBody(sendDeviceKeyEmailSchema),
  emailController.sendDeviceKey
)

router.post(
  '/device-key',
  validateBody(sendDeviceKeyEmailSchema),
  emailController.sendDeviceKey
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

router.post(
  '/password-reset',
  validateBody(passwordResetEmailSchema),
  emailController.sendPasswordReset
)

router.post(
  '/password-changed',
  validateBody(passwordChangedEmailSchema),
  emailController.sendPasswordChanged
)

export default router
