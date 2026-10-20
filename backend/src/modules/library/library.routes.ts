import { Router } from 'express'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/helpers.js'
import {
  getLicenseKeySchema,
  grantLibraryAccessSchema,
  renewLibraryAccessSchema,
} from './library.schema.js'
import { libraryController } from './library.controller.js'
import { serviceAuth } from '../../shared/middlewares/service-auth.middleware.js'
import { authMiddleware } from '../auth/auth.middleware.js'

const router = Router()

router.post(
  '/grant',
  serviceAuth.verifySubscriptionServiceKey,
  validateBody(grantLibraryAccessSchema),
  libraryController.grantLibraryAccess
)

router.patch(
  '/renew',
  serviceAuth.verifySubscriptionServiceKey,
  validateBody(renewLibraryAccessSchema),
  libraryController.renewLibraryAccess
)

router.get(
  '/:subscriptionId/license-key',
  authMiddleware.verifyAccess,
  validateParams('subscriptionId'),
  libraryController.getLicenseKey
)


router.delete(
  '/:subscriptionId',
  serviceAuth.verifySubscriptionServiceKey,
  validateParams('subscriptionId'),
  libraryController.revokeLibraryAccess
)

export default router

