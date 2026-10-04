import type { NextFunction, Request, Response } from 'express'
import { authService } from './auth.service.js'

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.validData!.body)
      res.status(201).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.validData!.body)
      res.cookie('refreshToken', result.rawRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refresh(req.tokens!.refreshToken)
      res.cookie('refreshToken', result.rawRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.logout(req.tokens!.refreshToken)
      res.clearCookie('refreshToken')
      res.status(200).json(result.response)
    } catch (err) {
      res.clearCookie('refreshToken')
      next(err)
    }
  },
}
