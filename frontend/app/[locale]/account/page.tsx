import type { Metadata } from 'next'

import { AccountScreen } from '@/src/features/account/components/AccountScreen'

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return <AccountScreen />
}
