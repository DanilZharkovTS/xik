import bcrypt from 'bcrypt'
import { authRepo } from './repos/auth.repo.js'
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './auth.schema.js'
import { tokenService } from '../../shared/services/token.service.js'
import { sessionRepo } from './repos/session.repo.js'
import { tokenRepo } from './repos/token.repo.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { prisma } from '../../shared/database/prisma.js'
import type { TokenPayload } from './auth.types.js'

export const authService = {
  register: async (data: RegisterDto) => {
    const user = await authRepo.findUserByEmail(data.email)

    if (user) {
      throw ApiError(400, 'BAD_REQUEST', 'User already exists')
    }

    const hashedPaswword = await bcrypt.hash(data.password, 10)
    await authRepo.createUser({
      ...data,
      password: hashedPaswword,
    })

    return { response: { created: true } }
  },
  login: async (data: LoginDto) => {
    const user = await authRepo.findUserWithCredentialsByEmail(data.email)

    if (!user || user.deactivatedAt || !user.credentials) {
      throw ApiError(401, 'UNAUTHORIZED', 'Email or/and password is incorrect')
    }

    const isCorrectPassword = await bcrypt.compare(
      data.password,
      user.credentials.passwordHash
    )
    if (!isCorrectPassword) {
      throw ApiError(401, 'UNAUTHORIZED', 'Email or/and password is incorrect')
    }

    const { rawRefreshToken, hashedRefreshToken, expiresAt } =
      tokenService.generateRefresh()
    const session = await sessionRepo.createSessionWithRefresh(
      user.id,
      hashedRefreshToken,
      expiresAt
    )

    const accessToken = await tokenService.generateAccess(
      user.id,
      user.email,
      user.role,
      session.id
    )

    return {
      response: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locale: user.locale,
          sessionId: session.id,
        },
        accessToken,
      },
      rawRefreshToken,
    }
  },
  refresh: async (refreshToken: string) => {
    const { rawRefreshToken, hashedRefreshToken, expiresAt } =
      tokenService.generateRefresh()

    const session = await prisma.$transaction(async (tx) => {
      const refresh = await sessionRepo.findRefreshWithSessionAndUserByToken(
        refreshToken,
        tx
      )

      if (
        !refresh ||
        refresh.expiresAt <= new Date() ||
        refresh.revokedAt ||
        refresh.session.revokedAt ||
        refresh.session.user.deactivatedAt
      ) {
        throw ApiError(401, 'UNAUTHORIZED', 'Session is expired or invalid')
      }

      if (!(await sessionRepo.consumeRefresh(refresh.id, tx))) {
        throw ApiError(
          401,
          'REFRESH_ALREADY_USED',
          'Refresh token has already been used'
        )
      }

      await sessionRepo.createRefresh(
        refresh.session.id,
        hashedRefreshToken,
        expiresAt,
        tx
      )

      return refresh.session
    })

    const user = session.user

    const accessToken = await tokenService.generateAccess(
      user.id,
      user.email,
      user.role,
      session.id
    )

    return {
      response: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locale: user.locale,
          sessionId: session.id,
        },
        accessToken,
      },
      rawRefreshToken,
    }
  },
  logout: async (token: string) => {
    const refresh = await sessionRepo.findRefreshWithSessionByToken(token)

    if (
      !refresh ||
      new Date() > refresh.expiresAt ||
      refresh.revokedAt ||
      refresh.session.revokedAt
    ) {
      throw ApiError(401, 'UNAUTHORIZED', 'Session is expired or invalid')
    }

    await sessionRepo.revokeSessionWithRefreshes(refresh.session.id)

    return { response: { loggedOut: true } }
  },
  sendPasswordResetEmail: async (
    user: { email: string; locale: 'en' | 'es' | 'uk'; name?: string | null },
    token: string
  ) => {
    const notificationsUrl =
      process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3002'
    const secret = process.env.NOTIFICATIONS_SERVICE_SECRET

    const response = await fetch(
      `${notificationsUrl.replace(/\/$/, '')}/api/email/password-reset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { service_token: secret } : {}),
        },
        body: JSON.stringify({
          to: user.email,
          token,
          locale: user.locale,
          userName: user.name ?? undefined,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `[Auth:PasswordReset] Failed to send email (${response.status}): ${errorText}`
      )
      throw ApiError(
        502,
        'NOTIFICATION_FAILED',
        'Failed to send password reset email'
      )
    }
  },
  sendPasswordChangedEmail: async (
    user: { email: string; locale: 'en' | 'es' | 'uk'; name?: string | null }
  ) => {
    const notificationsUrl =
      process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3002'
    const secret = process.env.NOTIFICATIONS_SERVICE_SECRET

    const response = await fetch(
      `${notificationsUrl.replace(/\/$/, '')}/api/email/password-changed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { service_token: secret } : {}),
        },
        body: JSON.stringify({
          to: user.email,
          locale: user.locale,
          userName: user.name ?? undefined,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `[Auth:PasswordChanged] Failed to send email (${response.status}): ${errorText}`
      )
      throw ApiError(
        502,
        'NOTIFICATION_FAILED',
        'Failed to send password changed email'
      )
    }
  },
  requestPasswordReset: async (data: RequestPasswordResetDto) => {
    const user = await authRepo.findUserByEmail(data.email)

    if (!user || user.deactivatedAt) {
      throw ApiError(404, 'NOT_FOUND', 'User not found')
    }

    const { rawToken, tokenHash, expiresAt } =
      tokenService.generateResetPasswordToken()

    await tokenRepo.createActionToken(
      user.id,
      'passwordReset',
      tokenHash,
      expiresAt
    )

    await authService.sendPasswordResetEmail(user, rawToken)

    return { response: { passwordResetWasRequested: true } }
  },
  requestPasswordChange: async (user: TokenPayload) => {
    const targetUser = await authRepo.findUserById(user.id)

    if (!targetUser || targetUser.deactivatedAt) {
      throw ApiError(404, 'NOT_FOUND', 'User not found')
    }

    const { rawToken, tokenHash, expiresAt } =
      tokenService.generateResetPasswordToken()

    await tokenRepo.createActionToken(
      targetUser.id,
      'passwordReset',
      tokenHash,
      expiresAt
    )

    await authService.sendPasswordResetEmail(targetUser, rawToken)

    return { response: { passwordResetWasRequested: true } }
  },
  changePassword: async (
    userPayload: TokenPayload,
    data: ChangePasswordDto
  ) => {
    const user = await authRepo.findUserWithCredentialsById(userPayload.id)

    if (!user || user.deactivatedAt || !user.credentials) {
      throw ApiError(404, 'NOT_FOUND', 'User not found')
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      data.currentPassword,
      user.credentials.passwordHash
    )

    if (!isCurrentPasswordCorrect) {
      throw ApiError(400, 'BAD_REQUEST', 'Current password is incorrect')
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 10)

    await authRepo.updatePassword(user.id, newPasswordHash)

    await authService.sendPasswordChangedEmail(user)

    return { response: { passwordChanged: true } }
  },
  resetPassword: async (data: ResetPasswordDto, tokenHash: string) => {
    const actionToken = await tokenRepo.findActionTokenByHash(
      tokenHash,
      'passwordReset'
    )

    if (
      !actionToken ||
      actionToken.type !== 'passwordReset' ||
      actionToken.usedAt ||
      actionToken.expiresAt < new Date()
    ) {
      throw ApiError(400, 'BAD_REQUEST', 'Token is invalid or expired')
    }

    const user = await authRepo.findUserWithCredentialsById(actionToken.userId)

    if (!user || user.deactivatedAt || !user.credentials) {
      throw ApiError(404, 'NOT_FOUND', 'User not found')
    }

    const isSameAsCurrent = await bcrypt.compare(
      data.newPassword,
      user.credentials.passwordHash
    )

    if (isSameAsCurrent) {
      throw ApiError(
        400,
        'BAD_REQUEST',
        'New password must be different from current password'
      )
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, 10)

    await prisma.$transaction(async (tx) => {
      await authRepo.updatePassword(user.id, newPasswordHash, tx)
      await tokenRepo.consumeActionToken(actionToken.id, tx)
      await sessionRepo.revokeAllForUser(user.id, tx)
    })

    await authService.sendPasswordChangedEmail(user)

    return { response: { passwordChanged: true } }
  },
}
