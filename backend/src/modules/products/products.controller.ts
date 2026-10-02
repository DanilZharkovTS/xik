import { NextFunction, Request, Response } from 'express'
import { productsService } from './products.service.js'

export const productsController = {
  toggleSavedProduct: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await productsService.toggleSavedProduct(
        req.user,
        req.validData.params.productId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  findProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.findProduct(
        req.validData.params.slug,
        req.user
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  findProducts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.findProducts(req.validData.query, req.user)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  findSavedProducts: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await productsService.findSavedProducts(
        req.user,
        req.pagination
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  listCatalog: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.listCatalog(req.validData.query)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  //admin
  listForAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.listForAdmin(req.validData.query)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  createProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.createProduct(req.validData.body)
      res.status(201).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  updateProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.updateProduct(
        req.validData.params.productId,
        req.validData.body
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  archiveProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.archiveProduct(
        req.validData.params.productId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  restoreProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.restoreProduct(
        req.validData.params.productId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  syncWithStripe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.syncWithStripe(
        req.validData.params.productId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}
