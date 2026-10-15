import type { Metadata } from 'next'
import { Suspense } from 'react'

import { ResetPasswordForm } from '@/src/features/auth/components/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center justify-center px-4">
          <p className="text-sm text-[var(--m)]">Loading...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
