import type { Metadata } from 'next'
import Link from 'next/link'
import { Rss } from 'lucide-react'

import { getAbsoluteUrl } from '@/src/config/site'
import { fetchArticles, fetchBlogTaxonomy } from '@/src/features/blog/blog-api'
import { ArticleCardView } from '@/src/features/blog/components/ArticleCardView'
import { cn } from '@/src/shared/lib/cn'
import { localizedPath, withLocale } from '@/src/shared/i18n/paths'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'
import { JsonLd } from '@/src/shared/seo/json-ld'

// Фільтри й сторінки йдуть через адресу, тож сторінка збирається на запит; самі дані кешуються.
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string; category?: string; page?: string }>
}

const pageNumber = (value: string | undefined): number => {
  const page = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const { tag, category, page } = await searchParams

  const metadata = createPageMetadata({
    title: translate(locale, 'blog.title'),
    description: translate(locale, 'blog.meta'),
    pathname: '/blog',
    locale,
  })

  // Відфільтровані вибірки дублюють основний список: у видачу йде лише головна сторінка блогу.
  const isFiltered = Boolean(tag || category) || pageNumber(page) > 1

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: { 'application/rss+xml': getAbsoluteUrl(localizedPath('/blog/rss.xml', locale)) },
    },
    ...(isFiltered ? { robots: { index: false, follow: true } } : {}),
  }
}

const chip = (active: boolean) =>
  cn(
    'inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition-colors',
    active
      ? 'border-[var(--t)] bg-[var(--t)] text-[var(--bg)]'
      : 'border-[var(--l)] text-[var(--m)] hover:border-[var(--t)] hover:text-[var(--t)]',
  )

export default async function BlogPage({ params, searchParams }: Props) {
  const locale = await localeFromParams(params)
  const { tag, category, page: rawPage } = await searchParams
  const page = pageNumber(rawPage)

  const [list, taxonomy] = await Promise.all([
    fetchArticles(locale, { tag, category, page }),
    fetchBlogTaxonomy(locale),
  ])

  const base = withLocale('/blog', locale)
  const link = (filter: { tag?: string; category?: string; page?: number }): string => {
    const query = new URLSearchParams()
    if (filter.category) query.set('category', filter.category)
    if (filter.tag) query.set('tag', filter.tag)
    if (filter.page && filter.page > 1) query.set('page', String(filter.page))
    const text = query.toString()
    return text ? `${base}?${text}` : base
  }

  const hasFilters = taxonomy.categories.length > 0 || taxonomy.tags.length > 0

  return (
    <>
      <JsonLd
        id="blog-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: translate(locale, 'blog.title'),
          description: translate(locale, 'blog.meta'),
          url: getAbsoluteUrl(localizedPath('/blog', locale)),
          inLanguage: locale,
        }}
      />
      <JsonLd
        id="breadcrumb-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'XIK', item: getAbsoluteUrl(localizedPath('/', locale)) },
            { '@type': 'ListItem', position: 2, name: translate(locale, 'blog.eyebrow'), item: getAbsoluteUrl(localizedPath('/blog', locale)) },
          ],
        }}
      />

      <section className="px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1360px]">
          <header className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">{translate(locale, 'blog.eyebrow')}</p>
            <h1 className="mt-2 text-[clamp(34px,5vw,60px)] font-bold leading-[1] tracking-[-0.045em] text-[var(--t)]">
              {translate(locale, 'blog.title')}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--m)] md:text-lg">{translate(locale, 'blog.intro')}</p>
            <a
              href={withLocale('/blog/rss.xml', locale)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--m)] hover:text-[var(--t)]"
            >
              <Rss className="h-4 w-4" />
              {translate(locale, 'blog.rss')}
            </a>
          </header>

          {hasFilters && (
            <nav aria-label={translate(locale, 'blog.filters')} className="mb-8 space-y-3">
              {taxonomy.categories.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  <li><Link href={link({ tag })} className={chip(!category)}>{translate(locale, 'blog.all')}</Link></li>
                  {taxonomy.categories.map((item) => (
                    <li key={item.id}>
                      <Link href={link({ category: item.slug, tag })} className={chip(category === item.slug)}>
                        {item.name} <span className="ml-1.5 opacity-60">{item.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {taxonomy.tags.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {taxonomy.tags.map((item) => (
                    <li key={item.id}>
                      <Link href={link({ category, tag: tag === item.slug ? undefined : item.slug })} className={chip(tag === item.slug)}>
                        #{item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          )}

          {list.articles.length === 0 ? (
            <p className="rounded-[24px] border border-[var(--l)] bg-[var(--s)] p-8 text-center text-sm text-[var(--m)]">
              {translate(locale, 'blog.empty')}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.articles.map((article, index) => (
                <li key={article.id}>
                  <ArticleCardView article={article} locale={locale} priority={index < 2 && page === 1} />
                </li>
              ))}
            </ul>
          )}

          {list.pages > 1 && (
            <nav aria-label={translate(locale, 'blog.pagination')} className="mt-10 flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link rel="prev" href={link({ category, tag, page: page - 1 })} className={chip(false)}>
                  {translate(locale, 'blog.prev')}
                </Link>
              ) : <span />}
              <span className="text-[var(--m)]">{translate(locale, 'blog.page', { page, pages: list.pages })}</span>
              {page < list.pages ? (
                <Link rel="next" href={link({ category, tag, page: page + 1 })} className={chip(false)}>
                  {translate(locale, 'blog.next')}
                </Link>
              ) : <span />}
            </nav>
          )}
        </div>
      </section>
    </>
  )
}
