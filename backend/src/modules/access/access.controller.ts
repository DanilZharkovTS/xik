import type { NextFunction, Request, Response } from 'express'
import { accessService } from './access.service.js'

export const accessController = {
  listMyProducts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await accessService.listMyProducts(req.user)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  getContext: (req: Request, res: Response) => {
    res.status(200).json({ productId: req.product!.id, role: req.user.role })
  },
}
