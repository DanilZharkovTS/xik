import { api } from '@/src/shared/api/axios'
import type {
  AdminArticle,
  AdminArticleRow,
  ArticlePayload,
  Asset,
  TaxonomyItem,
} from './admin-blog.types'

const withToken = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export const adminBlogService = {
  list: async (params: { state: string; q?: string }, token: string): Promise<AdminArticleRow[]> =>
    (await api.get('/blog/admin/articles', { params, ...withToken(token) })).data.articles,

  get: async (id: string, token: string): Promise<AdminArticle> =>
    (await api.get(`/blog/admin/articles/${id}`, withToken(token))).data.article,

  create: async (payload: ArticlePayload, token: string): Promise<AdminArticle> =>
    (await api.post('/blog/admin/articles', payload, withToken(token))).data.article,

  update: async (id: string, payload: Partial<ArticlePayload>, token: string): Promise<AdminArticle> =>
    (await api.patch(`/blog/admin/articles/${id}`, payload, withToken(token))).data.article,

  rotatePreview: async (id: string, token: string): Promise<string> =>
    (await api.post(`/blog/admin/articles/${id}/preview-token`, {}, withToken(token))).data.previewToken,

  taxonomy: async (token: string): Promise<{ categories: TaxonomyItem[]; tags: TaxonomyItem[] }> =>
    (await api.get('/blog/admin/taxonomy', withToken(token))).data,

  createCategory: async (data: Omit<TaxonomyItem, 'id'>, token: string): Promise<TaxonomyItem> =>
    (await api.post('/blog/admin/categories', data, withToken(token))).data.category,

  createTag: async (data: Omit<TaxonomyItem, 'id'>, token: string): Promise<TaxonomyItem> =>
    (await api.post('/blog/admin/tags', data, withToken(token))).data.tag,

  // Зображення йде тілом запиту як є; бекенд сам перевіряє вміст.
  upload: async (file: File, token: string): Promise<Asset> =>
    (
      await api.post('/media', file, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type },
      })
    ).data.asset,

  library: async (page: number, token: string): Promise<{ assets: Asset[]; pages: number }> =>
    (await api.get('/media', { params: { page }, ...withToken(token) })).data,
}
