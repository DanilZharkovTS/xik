import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit'
import type { Request } from 'express'
import { ApiError } from '../utils/ApiError.js'

// Ліміти для ендпоінтів, що шлють листи або створюють акаунти: захист від
// email-бомбінгу (і витрати квоти Resend) та масової реєстрації.
// Значення можна перевизначити змінними середовища.

const limitFromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const normalizedEmail = (req: Request) =>
  typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''

const ipKey = (req: Request) => ipKeyGenerator(req.ip ?? '')

const limiter = (
  code: string,
  message: string,
  options: Pick<Options, 'windowMs' | 'limit' | 'keyGenerator'>
) =>
  rateLimit({
    ...options,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) => next(ApiError(429, code, message)),
  })

const RESET_MESSAGE =
  'Too many password reset requests, try again in a few minutes'

// Скільки листів скидання пароля можна надіслати на одну адресу.
export const passwordResetEmailLimiter = limiter(
  'RATE_LIMITED',
  RESET_MESSAGE,
  {
    windowMs: 15 * 60_000,
    limit: limitFromEnv('PASSWORD_RESET_EMAIL_RATE_LIMIT', 3),
    keyGenerator: (req) => `reset-email:${normalizedEmail(req) || ipKey(req)}`,
  }
)

// Скільки запитів на скидання пароля може зробити одна IP-адреса (на різні адреси).
export const passwordResetIpLimiter = limiter('RATE_LIMITED', RESET_MESSAGE, {
  windowMs: 60 * 60_000,
  limit: limitFromEnv('PASSWORD_RESET_IP_RATE_LIMIT', 20),
  keyGenerator: (req) => `reset-ip:${ipKey(req)}`,
})

// Лист для зміни пароля з кабінету: ліміт на користувача. Ставиться після verifyAccess.
export const passwordChangeRequestLimiter = limiter(
  'RATE_LIMITED',
  RESET_MESSAGE,
  {
    windowMs: 15 * 60_000,
    limit: limitFromEnv('PASSWORD_CHANGE_REQUEST_RATE_LIMIT', 3),
    keyGenerator: (req) => `change-user:${req.user?.id ?? ipKey(req)}`,
  }
)

// Реєстрація: ліміт на IP-адресу.
export const registerLimiter = limiter(
  'RATE_LIMITED',
  'Too many sign-up attempts, try again later',
  {
    windowMs: 60 * 60_000,
    limit: limitFromEnv('REGISTER_RATE_LIMIT', 10),
    keyGenerator: (req) => `register:${ipKey(req)}`,
  }
)
