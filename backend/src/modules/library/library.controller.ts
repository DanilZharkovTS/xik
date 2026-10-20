import { NextFunction, Request, Response } from 'express'
import { libraryService } from './library.service.js'

export const libraryController = {
  grantLibraryAccess: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await libraryService.grantLibraryAccess(
        req.validData!.body
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  renewLibraryAccess: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await libraryService.renewLibraryAccess(
        req.validData!.body
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  revokeLibraryAccess: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await libraryService.revokeLibraryAccess(
        req.validData!.params.subscriptionId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  getLicenseKey: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const subscriptionId =
        req.validData?.body?.subscriptionId ||
        req.validData?.query?.subscriptionId ||
        req.validData?.params?.subscriptionId ||
        req.params.subscriptionId ||
        req.body?.subscriptionId ||
        req.query?.subscriptionId

      const result = await libraryService.getLicenseKey(req.user, subscriptionId)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}

