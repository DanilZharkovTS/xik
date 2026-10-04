import type { NextFunction, Request, Response } from 'express'
import { notifyCatalogChanged } from '../products/catalog-revalidate.js'
import { blogService } from './blog.service.js'

type Handler = (req: Request) => Promise<{ response: unknown }>

// Один обгортач замість повторюваного try/catch; зміни в адмінці скидають кеш сайту.
const handle =
  (run: Handler, options: { status?: number; invalidate?: boolean } = {}) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await run(req)
      if (options.invalidate) notifyCatalogChanged()
      res.status(options.status ?? 200).json(result.response)
    } catch (err) {
      next(err)
    }
  }

const params = (req: Request) => req.validData!.params
const query = (req: Request) => req.validData!.query
const body = (req: Request) => req.validData!.body

export const blogController = {
  listPublic: handle((req) => blogService.listPublic(query(req))),
  getPublic: handle((req) => blogService.getPublic(params(req).slug, query(req).lang)),
  getPreview: handle((req) => blogService.getPreview(params(req).token, query(req).lang)),
  taxonomy: handle((req) => blogService.taxonomy(query(req).lang)),
  feed: handle(() => blogService.feed()),

  listAdmin: handle((req) => blogService.listAdmin(query(req))),
  getAdmin: handle((req) => blogService.getAdmin(params(req).id)),
  create: handle((req) => blogService.create(req.user, body(req)), { status: 201, invalidate: true }),
  update: handle((req) => blogService.update(params(req).id, body(req)), { invalidate: true }),
  rotatePreviewToken: handle((req) => blogService.rotatePreviewToken(params(req).id)),

  listTaxonomyAdmin: handle(() => blogService.listTaxonomyAdmin()),
  createCategory: handle((req) => blogService.createCategory(body(req)), { status: 201, invalidate: true }),
  updateCategory: handle((req) => blogService.updateCategory(params(req).id, body(req)), { invalidate: true }),
  deleteCategory: handle((req) => blogService.deleteCategory(params(req).id), { invalidate: true }),
  createTag: handle((req) => blogService.createTag(body(req)), { status: 201, invalidate: true }),
  updateTag: handle((req) => blogService.updateTag(params(req).id, body(req)), { invalidate: true }),
  deleteTag: handle((req) => blogService.deleteTag(params(req).id), { invalidate: true }),
}
