import type { NextFunction, Request, Response } from 'express'
import { templatesService } from './templates.service.js'

type Handler = (req: Request) => Promise<{ status?: number; response: unknown }>

// Усі обробники однакові: викликати сервіс і віддати результат зі статусом.
const handle =
  (run: Handler, defaultStatus = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await run(req)
      res.status(result.status ?? defaultStatus).json(result.response)
    } catch (err) {
      next(err)
    }
  }

const idOf = (req: Request): string => req.validData!.params.templateId

export const templatesController = {
  list: handle((req) =>
    templatesService.list(req.user, req.product!.id, req.validData!.query)
  ),
  get: handle((req) => templatesService.get(req.user, req.product!.id, idOf(req))),
  create: handle(
    (req) => templatesService.create(req.user, req.product!.id, req.validData!.body),
    201
  ),
  update: handle((req) =>
    templatesService.update(req.user, req.product!.id, idOf(req), req.validData!.body)
  ),
  archive: handle((req) => templatesService.archive(req.user, req.product!.id, idOf(req))),
  restore: handle((req) => templatesService.restore(req.user, req.product!.id, idOf(req))),
  duplicate: handle(
    (req) => templatesService.duplicate(req.user, req.product!.id, idOf(req)),
    201
  ),
  remove: handle((req) => templatesService.remove(req.user, req.product!.id, idOf(req))),
}
