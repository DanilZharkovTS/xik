'use client'
import { Logout } from '@/src/features/auth/components/Logout'
import useAuthStore from '@/src/features/auth/store'
import Link from 'next/link'

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === 'admin'

  return (
    <div>
      {isAdmin && 'Admin Dashboard'}
      {isAdmin && (
        <div className="flex flex-col gap-2 p-4 sm:flex-row">
          <Link
            href="/admin/team"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--t)] bg-[var(--t)] px-5 text-base font-medium text-[var(--bg)]"
          >
            Team
          </Link>
        </div>
      )}
      <Logout />
    </div>
  )
}

export default Dashboard
