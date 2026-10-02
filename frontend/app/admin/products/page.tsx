import type { Metadata } from 'next'

import { AdminProductsScreen } from '@/src/features/admin-products/components/AdminProductsScreen'

export const metadata: Metadata = {
  title: 'Products',
  robots: { index: false, follow: false },
}

const AdminProductsPage = () => {
  return <AdminProductsScreen />
}

export default AdminProductsPage
