import { NextFunction, Request, Response } from "express"
import { userService } from "./user.service.js"

export const userController = {
  findUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.findUsers(req.validData.query)
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
  //admin
  changeUserRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.changeUserRole(
        req.user,
        req.validData.params.userId,
        req.validData.body.role
      )
      res.status(200).json(result.response)
    } catch (err) {
      next(err)
    }
  },
}