import type { Metadata } from 'next'
import { Suspense } from 'react'

import { UsersList } from '@/src/features/user/components/UsersList'

export const metadata: Metadata = {
  title: 'Users',
  robots: { index: false, follow: false },
}

const AdminUsersPage = () => {
  return (
    <Suspense fallback={<p className="p-8 text-center text-[var(--m)]">Loading...</p>}>
      <UsersList />
    </Suspense>
  )
}

export default AdminUsersPage
