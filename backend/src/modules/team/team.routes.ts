import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/helpers.js'
import { teamController } from './team.controller.js'
import {
  createModeratorSchema,
  grantProductSchema,
  listOwnedTargetsSchema,
  resetPasswordSchema,
  transferTargetsSchema,
} from './team.schema.js'

const router = Router()

// Усе тут лише для адміна.
router.use(authMiddleware.verifyAccess, authMiddleware.requiresRole('admin'))

router.get('/moderators', teamController.listModerators)

router.post(
  '/moderators',
  validateBody(createModeratorSchema),
  teamController.createModerator
)

router.patch(
  '/moderators/:userId/password',
  validateParams('userId'),
  validateBody(resetPasswordSchema),
  teamController.resetPassword
)

router.post(
  '/moderators/:userId/deactivate',
  validateParams('userId'),
  teamController.deactivate
)

router.post(
  '/moderators/:userId/activate',
  validateParams('userId'),
  teamController.activate
)

router.post(
  '/moderators/:userId/products',
  validateParams('userId'),
  validateBody(grantProductSchema),
  teamController.grantProduct
)

router.delete(
  '/moderators/:userId/products/:productId',
  validateParams('userId', 'productId'),
  teamController.revokeProduct
)

router.get(
  '/targets',
  validateQuery(listOwnedTargetsSchema),
  teamController.listOwnedTargets
)

router.post(
  '/transfer-targets',
  validateBody(transferTargetsSchema),
  teamController.transferTargets
)

export default router
