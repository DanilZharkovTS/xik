import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { fetchArticle } from '@/src/features/blog/blog-api'
import { ArticleView, articlePath } from '@/src/features/blog/components/ArticleView'
import { siteConfig } from '@/src/config/site'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'
import { truncate } from '@/src/shared/seo/truncate'

// Статті не збираються під час білду (вони в БД): кешуються при першому запиті, скидаються тегом 'blog'.
export const revalidate = 300

export function generateStaticParams(): { slug: string }[] {
  return []
}

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = await localeFromParams(params)
  const article = await fetchArticle(slug, locale)

  if (!article) {
    return createPageMetadata({
      title: translate(locale, 'blog.notFound'),
      description: translate(locale, 'blog.notFoundDesc'),
      pathname: articlePath(slug),
      locale,
    })
  }

  const alternatePaths = Object.fromEntries(
    Object.entries(article.alternates).map(([code, value]) => [code, articlePath(value)]),
  ) as Partial<Record<Locale, string>>

  // Власна картка: обкладинка або (без кирилиці в шрифті) сторінка без згенерованої картки.
  const image = article.cover?.url ?? (locale === 'uk' ? siteConfig.openGraphImage : `${articlePath(article.slug)}/opengraph-image`)

  const metadata = createPageMetadata({
    title: truncate(article.seoTitle || article.title, 52),
    description: truncate(article.seoDescription || article.excerpt, 158),
    pathname: articlePath(article.slug),
    alternatePaths,
    availableLocales: Object.keys(alternatePaths) as Locale[],
    locale,
    image,
  })

  return {
    ...metadata,
    ...(article.keywords.length > 0 ? { keywords: article.keywords } : {}),
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      modifiedTime: article.updatedAt,
      ...(article.tags.length > 0 ? { tags: article.tags.map((tag) => tag.name) } : {}),
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const locale = await localeFromParams(params)
  const article = await fetchArticle(slug, locale)

  if (!article) notFound()

  return <ArticleView article={article} locale={locale} />
}
