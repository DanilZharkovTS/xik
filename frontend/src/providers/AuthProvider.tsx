'use client'

import React, { useEffect } from 'react'
import { authService } from '../features/auth/auth.service'
import useAuthStore from '../features/auth/store'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const setAuthStatus = useAuthStore((state) => state.setAuthStatus)
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await authService.refresh()
        if (!res.accessToken || !res.user) {
          setAuthStatus('unauthenticated')
          return
        }
        setAuth({
          accessToken: res.accessToken,
          user: res.user,
        })
      } catch (err) {
        // 401 при старті означає лише "ще не входили": це звичайний стан, а не помилка.
        if (isAxiosError(err) && err.response?.status === 401) {
          setAuthStatus('unauthenticated')
          return
        }

        if (err instanceof Error) {
          toast.error(err.message)
        }
        console.error(err)
        setAuthStatus('unauthenticated')
        return
      }
    }
    refresh()
  }, [setAuth, setAuthStatus])
  return <>{children}</>
}
