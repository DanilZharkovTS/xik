import { api } from '@/src/shared/api/axios'
import { CreateProductDto, UpdateProductDto } from '../products.schema'

export const productsService = {
  createProduct: async (data: CreateProductDto, token: string) => {
    const res = await api.post('http://localhost:3000/api/products', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return res.data
  },
  findProducts: async (search: string, token: string | null) => {
    const res = await api.get('http://localhost:3000/api/products', {
      params: { name: search ? search : null },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return res.data
  },
  findProduct: async (slug: string, token: string | null) => {
    const res = await api.get(`http://localhost:3000/api/products/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return res.data
  }, 
  findSavedProducts: async (token: string) => {
    const res = await api.get('http://localhost:3000/api/products/saved', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return res.data
  },
  updateProduct: async (id: string, data: UpdateProductDto, token: string) => {
    const res = await api.patch(`http://localhost:3000/api/products/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return res.data
  },
  toggleSaveProduct: async (id: string, token: string) => {
    const res = await api.post(`http://localhost:3000/api/products/${id}/save`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return res
  },
  deleteProduct: async (id: string, token: string) => {
    const res = await api.delete(`http://localhost:3000/api/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return res.data
  },
}
