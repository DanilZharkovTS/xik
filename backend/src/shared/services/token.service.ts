import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import { UserRole } from '../../modules/user/user.types.js'

export const tokenService = {
  generateAccess: async (userId: string, email: string,role: UserRole, sessionId: string) => {
    const token = jwt.sign(
      {
        id: userId,
        email: email,
        role: role,
        sessionId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )
    return token
  },
  generateRefresh: () => {
    const rawRefreshToken = tokenService.generateRandom()
    const hashedRefreshToken = tokenService.hash(rawRefreshToken)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    return {
      rawRefreshToken,
      hashedRefreshToken,
      expiresAt,
    }
  },
  generateRandom: () => {
    return randomBytes(32).toString('hex')
  },
  hash: (token: string) => {
    return createHash('sha256').update(token).digest('hex')
  },
}
