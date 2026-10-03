import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { fetchPreview } from '@/src/features/blog/blog-api'
import { ArticleView } from '@/src/features/blog/components/ArticleView'
import { localeFromParams } from '@/src/shared/i18n/server'

// Чернетка за секретним посиланням: без кешу, поза індексом, без згадок у розмітці.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ locale: string; token: string }> }

export default async function PreviewPage({ params }: Props) {
  const { token } = await params
  const locale = await localeFromParams(params)
  const article = await fetchPreview(token, locale)

  if (!article) notFound()

  return <ArticleView article={article} locale={locale} />
}
