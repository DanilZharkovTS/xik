import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import libraryRoutes from "./modules/library/library.routes.js";

const router = Router()

router.use('/auth', authRoutes)

router.use('/users', userRoutes)

router.use('/products', productsRoutes)

router.use('/billing', billingRoutes)

router.use('/library', libraryRoutes)

export default router