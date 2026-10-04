import express, { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../auth/auth.middleware.js'
import { validateQuery } from '../../shared/middlewares/helpers.js'
import { ACCEPTED_MIME, MAX_UPLOAD_BYTES, mediaService } from './media.service.js'

const router = Router()

router.use(authMiddleware.verifyAccess, authMiddleware.requiresRole('admin'))

// Зображення приходить тілом запиту як є (Content-Type картинки): без multipart і зайвих залежностей.
router.post(
  '/',
  express.raw({ type: ACCEPTED_MIME, limit: MAX_UPLOAD_BYTES + 1 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await mediaService.upload(req.user, req.body)
      res.status(201).json(result.response)
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  '/',
  validateQuery(z.object({ page: z.coerce.number().int().min(1).max(1000).default(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await mediaService.list(req.validData!.query.page)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  }
)

export default router
