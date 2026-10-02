'use client'

import React, { useEffect } from 'react'
import { authService } from '../features/auth/auth.service'
import useAuthStore from '../features/auth/store'
import { toast } from 'sonner'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setAuth = useAuthStore((state) => state.setAuth)
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await authService.refresh()
        setAuth({
          accessToken: res.accessToken,
          user: res.user,
        })
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message)
        }
        console.error(err)
        return
      }
    }
    refresh()
  }, [setAuth])
  return <>{children}</>
}
