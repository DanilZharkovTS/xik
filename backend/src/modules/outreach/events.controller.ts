import type { NextFunction, Request, Response } from 'express'
import { eventsService } from './events.service.js'
import { publicationsService } from './publications.service.js'

export const eventsController = {
  add: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await eventsService.add(
        req.user,
        req.product!.id,
        req.validData!.params.targetId,
        req.validData!.body
      )
      res.status(result.status).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  markDoNotContact: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await eventsService.markDoNotContact(
        req.user,
        req.product!.id,
        req.validData!.params.targetId,
        req.validData!.body
      )
      res.status(result.status).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  release: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await eventsService.release(
        req.user,
        req.product!.id,
        req.validData!.params.targetId
      )
      res.status(result.status).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  createPublication: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await publicationsService.create(
        req.user,
        req.product!.id,
        req.validData!.body
      )
      res.status(result.status).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  listPublications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await publicationsService.list(
        req.user,
        req.product!.id,
        req.validData!.query
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}
