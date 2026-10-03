import type { NextFunction, Request, Response } from 'express'
import { accountService } from './account.service.js'

export const accountController = {
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.getProfile(req.user)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.updateProfile(req.user, req.validData.body)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  listLibrary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.listLibrary(req.user, req.validData.query.lang)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  listSaved: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accountService.listSaved(req.user, req.validData.query.lang)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}
