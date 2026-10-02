import { LoginDto, RegisterDto } from './auth.schema'
import { api } from '@/src/shared/api/axios'

export const authService = {
  register: async (data: RegisterDto) => {
    console.log(data)

    const res = await api.post('http://localhost:3000/api/auth/register', data)
    return res
  },
  login: async (data: LoginDto) => {
    const res = await api.post('http://localhost:3000/api/auth/login', data)
    return res.data
  },
  refresh: async () => {
    const res = await api.post('http://localhost:3000/api/auth/refresh', {})
    return res.data
  },
  logout: async () => {
    const res = await api.post('http://localhost:3000/api/auth/logout', {})
    return res.data
  },
}
