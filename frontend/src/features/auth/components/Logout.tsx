'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { authService } from '../auth.service'
import useAuthStore from '../store'

import { Button } from '@/src/shared/ui/button'
import { useRouter } from 'next/navigation'

export const Logout = () => {
  const router = useRouter()

  const clearAuth = useAuthStore((state) => state.clearAuth)

  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoading(true)

      await authService.logout()

      clearAuth()
      router.push('/auth/login')
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }

      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--l)] bg-[var(--s)]">
      <div className="flex items-center justify-between border-b border-[var(--l)] px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--m)]">
          session
        </span>

        <span className="font-mono text-xs text-[var(--m)]">active</span>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-sm">Terminate session</p>

          <p className="mt-1 font-mono text-xs text-[var(--m)]">
            Sign out from the current device.
          </p>
        </div>

        <Button variant="secondary" onClick={handleLogout} disabled={isLoading}>
          {isLoading ? 'Signing out...' : 'Log out'}
        </Button>
      </div>
    </div>
  )
}
