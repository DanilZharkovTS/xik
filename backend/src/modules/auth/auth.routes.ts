import { Router } from 'express'
import { authMiddleware } from './auth.middleware.js'
import {
  loginSchema,
  registerSchema,
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
  '/reset-password',
  validateBody(resetPasswordSchema),
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
