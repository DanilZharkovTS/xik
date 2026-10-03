import type { NextFunction, Request, Response } from 'express'
import { targetsService } from './targets.service.js'

export const targetsController = {
  check: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await targetsService.check(
        req.user,
        req.product!.id,
        req.validData!.body
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await targetsService.register(
        req.user,
        req.product!.id,
        req.validData!.body
      )
      res.status(result.status).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  addIdentifier: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await targetsService.addIdentifier(
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
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await targetsService.list(
        req.user,
        req.product!.id,
        req.validData!.query
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await targetsService.get(
        req.user,
        req.product!.id,
        req.validData!.params.targetId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}
