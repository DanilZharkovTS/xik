'use client'
import { Logout } from '@/src/features/auth/components/Logout'
import useAuthStore from '@/src/features/auth/store'

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === 'admin'

  return (
    <div>
      {isAdmin && 'Admin Dashboard'}
      <Logout />
    </div>
  )
}

export default Dashboard
