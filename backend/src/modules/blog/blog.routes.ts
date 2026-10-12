import { Router } from 'express'
import { authMiddleware } from '../auth/auth.middleware.js'
import {
  validateBody,
  validateParams,
  validateParamsString,
  validateQuery,
} from '../../shared/middlewares/helpers.js'
import { blogController } from './blog.controller.js'
import {
  adminListSchema,
  createArticleSchema,
  publicLangSchema,
  publicListSchema,
  taxonomySchema,
  taxonomyUpdateSchema,
  updateArticleSchema,
} from './blog.schema.js'

const router = Router()

// ---------- публічне ----------

router.get(
  '/articles',
  validateQuery(publicListSchema),
  blogController.listPublic
)
router.get(
  '/taxonomy',
  validateQuery(publicLangSchema),
  blogController.taxonomy
)
router.get('/feed', blogController.feed)
router.get(
  '/preview/:token',
  validateParamsString('token'),
  validateQuery(publicLangSchema),
  blogController.getPreview
)

// ---------- адмінка (лише admin) ----------

const admin = [
  authMiddleware.verifyAccess,
  authMiddleware.requiresRole('admin'),
]

router.get(
  '/admin/articles',
  ...admin,
  validateQuery(adminListSchema),
  blogController.listAdmin
)
router.post(
  '/admin/articles',
  ...admin,
  validateBody(createArticleSchema),
  blogController.create
)
router.get(
  '/admin/articles/:id',
  ...admin,
  validateParams('id'),
  blogController.getAdmin
)
router.patch(
  '/admin/articles/:id',
  ...admin,
  validateParams('id'),
  validateBody(updateArticleSchema),
  blogController.update
)
router.post(
  '/admin/articles/:id/preview-token',
  ...admin,
  validateParams('id'),
  blogController.rotatePreviewToken
)

router.get('/admin/taxonomy', ...admin, blogController.listTaxonomyAdmin)
router.post(
  '/admin/categories',
  ...admin,
  validateBody(taxonomySchema),
  blogController.createCategory
)
router.patch(
  '/admin/categories/:id',
  ...admin,
  validateParams('id'),
  validateBody(taxonomyUpdateSchema),
  blogController.updateCategory
)
router.delete(
  '/admin/categories/:id',
  ...admin,
  validateParams('id'),
  blogController.deleteCategory
)
router.post(
  '/admin/tags',
  ...admin,
  validateBody(taxonomySchema),
  blogController.createTag
)
router.patch(
  '/admin/tags/:id',
  ...admin,
  validateParams('id'),
  validateBody(taxonomyUpdateSchema),
  blogController.updateTag
)
router.delete(
  '/admin/tags/:id',
  ...admin,
  validateParams('id'),
  blogController.deleteTag
)

// Slug статті (унікальний у межах мови) шукається в публічному маршруті: має йти останнім,
// щоб не перехоплювати /taxonomy, /feed тощо.
router.get(
  '/articles/:slug',
  validateParamsString('slug'),
  validateQuery(publicLangSchema),
  blogController.getPublic
)

export default router
