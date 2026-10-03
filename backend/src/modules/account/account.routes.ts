import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import { validateBody, validateQuery } from '../../shared/middlewares/helpers.js'
import { langQuerySchema } from '../products/products.schema.js'
import { updateAccountSchema } from './account.schema.js'
import { accountController } from './account.controller.js'

// Кабінет клієнта: профіль і мова, покупки, збережені продукти. Усе лише про самого користувача.
const router = Router()

router.use(authMiddleware.verifyAccess)

router.get('/', accountController.getProfile)
router.patch('/', validateBody(updateAccountSchema), accountController.updateProfile)
router.get('/library', validateQuery(langQuerySchema), accountController.listLibrary)
router.get('/saved', validateQuery(langQuerySchema), accountController.listSaved)

export default router
