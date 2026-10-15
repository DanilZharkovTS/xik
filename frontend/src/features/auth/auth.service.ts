import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './auth.schema'
import { api, refreshSession } from '@/src/shared/api/axios'
import useAuthStore from './store'

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
  resetPassword: async (data: ResetPasswordDto) => {
    const res = await api.post('/auth/reset-password', data)
    return res.data
  },
  changePassword: async (data: ChangePasswordDto, token?: string | null) => {
    const t = token ?? useAuthStore.getState().accessToken
    const config = t ? { headers: { Authorization: `Bearer ${t}` } } : undefined
    try {
      const res = await api.post('/auth/change-password', data, config)
      return res.data
    } catch (err: unknown) {
      const is404 =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 404
      if (is404) {
        const res = await api.post('/auth/password-change', data, config)
        return res.data
      }
      throw err
    }
  },
  requestPasswordChange: async (token?: string | null) => {
    const t = token ?? useAuthStore.getState().accessToken
    const config = t ? { headers: { Authorization: `Bearer ${t}` } } : undefined
    const res = await api.post('/auth/request-password-change', {}, config)
    return res.data
  },
  refresh: refreshSession,
  logout: async () => {
    const res = await api.post('/auth/logout', {})
    return res.data
  },
}
