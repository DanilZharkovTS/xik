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
  //admin
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
  deleteProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await productsService.deleteProduct(
        req.validData.params.productId
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}
