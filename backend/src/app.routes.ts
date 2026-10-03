import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import libraryRoutes from "./modules/library/library.routes.js";
import accountRoutes from "./modules/account/account.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import blogRoutes from "./modules/blog/blog.routes.js";
import teamRoutes from "./modules/team/team.routes.js";
import accessRoutes from "./modules/access/access.routes.js";
import outreachRoutes from "./modules/outreach/outreach.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";

const router = Router()

router.use('/auth', authRoutes)

router.use('/users', userRoutes)

router.use('/products', productsRoutes)

router.use('/billing', billingRoutes)

router.use('/library', libraryRoutes)

router.use('/account', accountRoutes)

router.use('/media', mediaRoutes)

router.use('/blog', blogRoutes)

router.use('/team', teamRoutes)

router.use('/me', accessRoutes)

router.use('/outreach', outreachRoutes)

router.use('/reports', reportsRoutes)

export default router