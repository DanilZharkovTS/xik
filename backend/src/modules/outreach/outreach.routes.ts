import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { authMiddleware } from '../auth/auth.middleware.js'
import { accessMiddleware } from '../access/access.middleware.js'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../shared/middlewares/helpers.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { eventsController } from './events.controller.js'
import {
  addEventSchema,
  addPublicationSchema,
  doNotContactSchema,
  listPublicationsSchema,
} from './events.schema.js'
import { targetsController } from './targets.controller.js'
import { templatesController } from './templates.controller.js'
import {
  createTemplateSchema,
  listTemplatesSchema,
  updateTemplateSchema,
} from './templates.schema.js'
import {
  addIdentifierSchema,
  checkSchema,
  listTargetsSchema,
  registerTargetSchema,
} from './targets.schema.js'

const router = Router()

// Ліміт на користувача (не на IP): перевірка й реєстрація діляться одним лічильником.
const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: Number(process.env.OUTREACH_RATE_LIMIT ?? 30),
  keyGenerator: (req) => req.user.id,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(ApiError(429, 'RATE_LIMITED', 'Too many requests, try again in a minute')),
})

// Усе тут працює в межах продукту, який сервер звіряє з членством користувача.
router.use(authMiddleware.verifyAccess, accessMiddleware.requireProduct)

router.post(
  '/check',
  writeLimiter,
  validateBody(checkSchema),
  targetsController.check
)

router.post(
  '/targets',
  writeLimiter,
  validateBody(registerTargetSchema),
  targetsController.register
)

router.get(
  '/targets',
  validateQuery(listTargetsSchema),
  targetsController.list
)

router.get(
  '/targets/:targetId',
  validateParams('targetId'),
  targetsController.get
)

router.post(
  '/targets/:targetId/identifiers',
  writeLimiter,
  validateParams('targetId'),
  validateBody(addIdentifierSchema),
  targetsController.addIdentifier
)

router.post(
  '/targets/:targetId/events',
  validateParams('targetId'),
  validateBody(addEventSchema),
  eventsController.add
)

router.post(
  '/targets/:targetId/do-not-contact',
  validateParams('targetId'),
  validateBody(doNotContactSchema),
  eventsController.markDoNotContact
)

// Знімає «не писати» лише адмін.
router.post(
  '/targets/:targetId/release',
  authMiddleware.requiresRole('admin'),
  validateParams('targetId'),
  eventsController.release
)

router.post(
  '/publications',
  validateBody(addPublicationSchema),
  eventsController.createPublication
)

router.get(
  '/publications',
  validateQuery(listPublicationsSchema),
  eventsController.listPublications
)

router.get(
  '/templates',
  validateQuery(listTemplatesSchema),
  templatesController.list
)

router.post(
  '/templates',
  validateBody(createTemplateSchema),
  templatesController.create
)

router.get(
  '/templates/:templateId',
  validateParams('templateId'),
  templatesController.get
)

router.patch(
  '/templates/:templateId',
  validateParams('templateId'),
  validateBody(updateTemplateSchema),
  templatesController.update
)

router.post(
  '/templates/:templateId/archive',
  validateParams('templateId'),
  templatesController.archive
)

router.post(
  '/templates/:templateId/restore',
  validateParams('templateId'),
  templatesController.restore
)

router.post(
  '/templates/:templateId/duplicate',
  validateParams('templateId'),
  templatesController.duplicate
)

// Остаточно видаляє лише адмін.
router.delete(
  '/templates/:templateId',
  authMiddleware.requiresRole('admin'),
  validateParams('templateId'),
  templatesController.remove
)

export default router
