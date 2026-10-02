import type { NextFunction, Request, Response } from 'express'
import { teamService } from './team.service.js'

export const teamController = {
  listModerators: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await teamService.listModerators()
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  createModerator: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await teamService.createModerator(
        req.user,
        req.validData.body
      )
      res.status(201).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await teamService.resetPassword(
        req.user,
        req.validData.params.userId,
        req.validData.body.password
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  deactivate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await teamService.deactivate(
        req.user,
        req.validData.params.userId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  activate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await teamService.activate(
        req.user,
        req.validData.params.userId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  grantProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await teamService.grantProduct(
        req.user,
        req.validData.params.userId,
        req.validData.body.productId
      )
      res.status(201).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  revokeProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await teamService.revokeProduct(
        req.user,
        req.validData.params.userId,
        req.validData.params.productId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}
