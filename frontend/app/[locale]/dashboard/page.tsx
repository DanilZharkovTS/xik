import type { Metadata } from 'next'

import { DashboardScreen } from '@/src/features/dashboard/components/DashboardScreen'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

const Dashboard = () => {
  return <DashboardScreen />
}

export default Dashboard
