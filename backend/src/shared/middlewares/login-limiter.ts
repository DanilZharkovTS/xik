import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { ApiError } from '../utils/ApiError.js'

// Обмежує підбір пароля: лічаться лише невдалі спроби, тож справжній користувач не страждає.
// Ключ це e-mail (за зворотним проксі всі клієнти мають одну IP-адресу), а без нього IP.
export const loginLimiter = rateLimit({
  windowMs: 5 * 60_000,
  limit: Number(process.env.LOGIN_RATE_LIMIT ?? 10),
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : ''
    return email || ipKeyGenerator(req.ip ?? '')
  },
  handler: (req, res, next) =>
    next(
      ApiError(
        429,
        'RATE_LIMITED',
        'Too many failed sign-in attempts, try again in a few minutes'
      )
    ),
})
