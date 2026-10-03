import type { Metadata } from 'next'

import { AdminBlogScreen } from '@/src/features/admin-blog/components/AdminBlogScreen'

export const metadata: Metadata = {
  title: 'Blog',
  robots: { index: false, follow: false },
}

export default function AdminBlogPage() {
  return <AdminBlogScreen />
}
