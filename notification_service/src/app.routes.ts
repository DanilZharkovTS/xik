import { Router } from 'express'
import emailRoutes from './modules/email/email.routes'

const router = Router()

router.use('/email', emailRoutes)

export default router