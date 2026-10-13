import { Router } from 'express'
import { authMiddleware } from './auth.middleware.js'
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from './auth.schema.js'
import { authController } from './auth.controller.js'
import { validateBody } from '../../shared/middlewares/helpers.js'
import { loginLimiter } from '../../shared/middlewares/login-limiter.js'

const router = Router()

router.post('/register', validateBody(registerSchema), authController.register)

router.post(
  '/login',
  validateBody(loginSchema),
  loginLimiter,
  authController.login
)

router.post(
  '/request-password-reset',
  validateBody(requestPasswordResetSchema),
  authController.requestPasswordReset
)

router.post(
  '/request-password-change',
  authMiddleware.verifyAccess,
  authController.requestPasswordChange
)

router.post(
  '/password-change',
  authMiddleware.verifyAccess,
  validateBody(changePasswordSchema),
  authController.changePassword
)

router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  authController.requestPasswordReset
)

router.post(
  '/refresh',
  authMiddleware.hashTokens('refreshToken'),
  authController.refresh
)

router.post(
  '/logout',
  authMiddleware.hashTokens('refreshToken'),
  authController.logout
)

export default router
