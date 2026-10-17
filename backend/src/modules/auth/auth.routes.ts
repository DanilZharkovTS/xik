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
import {
  passwordChangeRequestLimiter,
  passwordResetEmailLimiter,
  passwordResetIpLimiter,
  registerLimiter,
} from '../../shared/middlewares/auth-limiters.js'

const router = Router()

router.post(
  '/register',
  registerLimiter,
  validateBody(registerSchema),
  authController.register
)

router.post(
  '/login',
  validateBody(loginSchema),
  loginLimiter,
  authController.login
)

router.post(
  '/request-password-reset',
  passwordResetIpLimiter,
  validateBody(requestPasswordResetSchema),
  passwordResetEmailLimiter,
  authController.requestPasswordReset
)

router.post(
  '/request-password-change',
  authMiddleware.verifyAccess,
  passwordChangeRequestLimiter,
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
  authMiddleware.hashTokens('token'),
  authController.resetPassword
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
