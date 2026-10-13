import {
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
} from './auth.schema'
import { api, refreshSession } from '@/src/shared/api/axios'

export const authService = {
  register: async (data: RegisterDto & { locale?: string }) => {
    const res = await api.post('/auth/register', data)
    return res
  },
  login: async (data: LoginDto) => {
    const res = await api.post('/auth/login', data)
    return res.data
  },
  requestPasswordReset: async (data: RequestPasswordResetDto) => {
    const res = await api.post('/auth/request-password-reset', data)
    return res.data
  },
  refresh: refreshSession,
  logout: async () => {
    const res = await api.post('/auth/logout', {})
    return res.data
  },
}
