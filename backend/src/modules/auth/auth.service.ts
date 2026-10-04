import bcrypt from 'bcrypt'
import { authRepo } from './repos/auth.repo.js'
import { LoginDto, RegisterDto } from './auth.schema.js'
import { tokenService } from '../../shared/services/token.service.js'
import { sessionRepo } from './repos/session.repo.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { prisma } from '../../shared/database/prisma.js'

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
}
