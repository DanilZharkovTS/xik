import { LoginDto, RegisterDto } from './auth.schema'
import { api } from '@/src/shared/api/axios'

export const authService = {
  register: async (data: RegisterDto & { locale?: string }) => {
    const res = await api.post('/auth/register', data)
    return res
  },
  login: async (data: LoginDto) => {
    const res = await api.post('/auth/login', data)
    return res.data
  },
  refresh: async () => {
    const res = await api.post('/auth/refresh', {})
    return res.data
  },
  logout: async () => {
    const res = await api.post('/auth/logout', {})
    return res.data
  },
}
