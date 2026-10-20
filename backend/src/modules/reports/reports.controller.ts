import type { NextFunction, Request, Response } from 'express'
import { reportsService } from './reports.service.js'
import { targetsService } from '../outreach/targets.service.js'

export const reportsController = {
  forProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await reportsService.forProduct(
        req.user,
        req.product!.id,
        req.validData!.query
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  followUps: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await targetsService.summaryForAdmin(
        req.validData!.query.productId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  forAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await reportsService.forAdmin(req.validData!.query)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}
