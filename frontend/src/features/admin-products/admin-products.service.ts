import { api } from '@/src/shared/api/axios'
import type {
  AdminProduct,
  ListState,
  ProductInput,
  ProductKind,
} from './admin-products.types'

const withToken = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
})

type ListParams = { state: ListState; kind?: ProductKind; q?: string }

// Відповіді бекенда: { product } або { products }.
export const adminProductsService = {
  list: async (params: ListParams, token: string): Promise<AdminProduct[]> => {
    const res = await api.get('/products/admin', { params, ...withToken(token) })
    return res.data.products
  },
  create: async (input: ProductInput, token: string): Promise<AdminProduct> => {
    const res = await api.post('/products', input, withToken(token))
    return res.data.product
  },
  update: async (
    id: string,
    input: Partial<ProductInput>,
    token: string,
  ): Promise<AdminProduct> => {
    const res = await api.patch(`/products/${id}`, input, withToken(token))
    return res.data.product
  },
  archive: async (id: string, token: string): Promise<AdminProduct> => {
    const res = await api.delete(`/products/${id}`, withToken(token))
    return res.data.product
  },
  restore: async (id: string, token: string): Promise<AdminProduct> => {
    const res = await api.post(`/products/${id}/restore`, {}, withToken(token))
    return res.data.product
  },
  syncStripe: async (id: string, token: string): Promise<AdminProduct> => {
    const res = await api.post(`/products/${id}/stripe-sync`, {}, withToken(token))
    return res.data.product
  },
}
