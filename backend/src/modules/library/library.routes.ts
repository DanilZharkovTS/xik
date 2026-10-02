import { Router } from 'express'
import { validateBody, validateParams } from '../../shared/middlewares/helpers.js'
import {
  grantLibraryAccessSchema,
  renewLibraryAccessSchema,
} from './library.schema.js'
import { libraryController } from './library.controller.js'
import { serviceAuth } from '../../shared/middlewares/service-auth.middleware.js'

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

router.delete(
  '/:subscriptionId',
  serviceAuth.verifySubscriptionServiceKey,
  validateParams('subscriptionId'),
  libraryController.revokeLibraryAccess
)

export default router
