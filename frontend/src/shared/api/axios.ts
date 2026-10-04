import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import useAuthStore from '@/src/features/auth/store'
import type { SetAuthData } from '@/src/features/auth/auth.types'

const apiUrl = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api`
  : '/api'

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// A separate client keeps a rejected refresh from recursively refreshing itself.
const sessionApi = axios.create({ baseURL: apiUrl, withCredentials: true })
let pendingRefresh: Promise<SetAuthData> | null = null

export function refreshSession(): Promise<SetAuthData> {
  if (pendingRefresh) return pendingRefresh
  const refresh = async () => {
    const { data } = await sessionApi.post<SetAuthData>('/auth/refresh', {})
    if (data.accessToken && data.user) useAuthStore.getState().setAuth(data)
    else useAuthStore.getState().clearAuth()
    return data
  }
  // Cookies are shared across tabs; serialize their rotation across the same origin.
  const pending = (async (): Promise<SetAuthData> => {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return await navigator.locks.request('xik:session-refresh', refresh)
    }
    return await refresh()
  })().finally(() => { pendingRefresh = null })
  pendingRefresh = pending
  return pending
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && config.headers.has('Authorization')) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

api.interceptors.response.use((response) => response, async (error: unknown) => {
  if (!axios.isAxiosError(error)) throw error
  const config = error.config as (InternalAxiosRequestConfig & { sessionRetried?: boolean }) | undefined
  if (error.response?.status !== 401 || !config || config.sessionRetried ||
      config.url?.startsWith('/auth/') || !config.headers.has('Authorization')) throw error
  config.sessionRetried = true
  const oldToken = config.headers.get('Authorization')
  try {
    // Another request may already have refreshed this token while this response was in flight.
    const current = useAuthStore.getState().accessToken
    const session = current && oldToken !== `Bearer ${current}`
      ? { accessToken: current }
      : await refreshSession()
    if (!session.accessToken) throw error
    config.headers = AxiosHeaders.from(config.headers)
    config.headers.set('Authorization', `Bearer ${session.accessToken}`)
    return await api.request(config)
  } catch (refreshError) {
    if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) useAuthStore.getState().clearAuth()
    throw refreshError
  }
})
