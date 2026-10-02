import { Router } from 'express'
import { userMiddleware } from './user.middleware.js'
import { userController } from './user.controller.js'
import { authMiddleware } from '../auth/auth.middleware.js'
import {
  validateBody,
  validateParams,
} from '../../shared/middlewares/helpers.js'
import { changeUserRoleSchema } from './user.schema.js'

const router = Router()

router.get(
  '/',
  authMiddleware.verifyAccess,
  userMiddleware.validateFindUsersQuery,
  userController.findUsers
)

router.patch(
  '/:userId',
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
  validateParams('userId'),
  validateBody(changeUserRoleSchema),
  userController.changeUserRole
)

export default router
