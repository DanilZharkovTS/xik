import { Suspense } from 'react'
import { UsersList } from '@/src/features/user/components/UsersList'

const AdminUsersPage = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--m)]">Loading users...</div>}>
      <UsersList />
    </Suspense>
  )
}

export default AdminUsersPage
