import type { Metadata } from 'next'
import { RequestPasswordResetForm } from '@/src/features/auth/components/RequestPasswordResetForm'

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

export default function RequestPasswordResetPage() {
  return <RequestPasswordResetForm />
}
