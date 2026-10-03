import type { Metadata } from 'next'

import { ArticleEditor } from '@/src/features/admin-blog/components/ArticleEditor'

export const metadata: Metadata = {
  title: 'Article',
  robots: { index: false, follow: false },
}

// id "new" створює статтю, інакше редагується наявна.
export default async function AdminArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <ArticleEditor articleId={id === 'new' ? null : id} />
}
