import type { Metadata } from 'next'
import Link from 'next/link'
import { Rss, SearchX, X } from 'lucide-react'

import { getAbsoluteUrl } from '@/src/config/site'
import { fetchArticles, fetchBlogTaxonomy } from '@/src/features/blog/blog-api'
import { ArticleCardView } from '@/src/features/blog/components/ArticleCardView'
import { BlogSearch } from '@/src/features/blog/components/BlogSearch'
import { BlogNewsletter } from '@/src/features/blog/components/BlogNewsletter'
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
  searchParams: Promise<{ tag?: string; category?: string; page?: string; q?: string }>
}

const pageNumber = (value: string | undefined): number => {
  const page = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const { tag, category, page, q } = await searchParams

  const metadata = createPageMetadata({
    title: q ? `${q} | ${translate(locale, 'blog.title')}` : translate(locale, 'blog.title'),
    description: translate(locale, 'blog.meta'),
    pathname: '/blog',
    locale,
  })

  // Відфільтровані вибірки дублюють основний список: у видачу йде лише головна сторінка блогу.
  const isFiltered = Boolean(tag || category || q) || pageNumber(page) > 1

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
    'inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm transition-all',
    active
      ? 'border-[var(--t)] bg-[var(--t)] text-[var(--bg)] font-medium shadow-sm'
      : 'border-[var(--l)] text-[var(--m)] hover:border-[var(--t)] hover:text-[var(--t)] bg-[var(--s)]/50',
  )

export default async function BlogPage({ params, searchParams }: Props) {
  const locale = await localeFromParams(params)
  const { tag, category, q, page: rawPage } = await searchParams
  const page = pageNumber(rawPage)

  const [list, taxonomy] = await Promise.all([
    fetchArticles(locale, { tag, category, q, page }),
    fetchBlogTaxonomy(locale),
  ])

  const base = withLocale('/blog', locale)
  const link = (filter: { tag?: string; category?: string; q?: string; page?: number }): string => {
    const query = new URLSearchParams()
    if (filter.category) query.set('category', filter.category)
    if (filter.tag) query.set('tag', filter.tag)
    if (filter.q) query.set('q', filter.q)
    if (filter.page && filter.page > 1) query.set('page', String(filter.page))
    const text = query.toString()
    return text ? `${base}?${text}` : base
  }

  const hasTaxonomy = taxonomy.categories.length > 0 || taxonomy.tags.length > 0
  const isFiltered = Boolean(tag || category || q)
  const activeCategory = taxonomy.categories.find((c) => c.slug === category)
  const activeTag = taxonomy.tags.find((t) => t.slug === tag)

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

      <section className="relative px-4 py-12 sm:px-6 md:py-20 overflow-hidden">
        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[380px] w-full max-w-5xl rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(ellipse at center, var(--b), transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-[1360px]">
          {/* Header */}
          <header className="mb-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--b)]">
                    {translate(locale, 'blog.eyebrow')}
                  </p>
                  <a
                    href={withLocale('/blog/rss.xml', locale)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--l)] bg-[var(--s)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--m)] hover:border-[var(--t)] hover:text-[var(--t)] transition-colors"
                  >
                    <Rss className="h-3 w-3 text-[var(--b)]" />
                    {translate(locale, 'blog.rss')}
                  </a>
                </div>

                <h1 className="mt-3 text-[clamp(34px,5vw,60px)] font-bold leading-[1.05] tracking-[-0.045em] text-[var(--t)]">
                  {translate(locale, 'blog.title')}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-[var(--m)] md:text-lg">
                  {translate(locale, 'blog.intro')}
                </p>
              </div>

              {/* Search bar */}
              <div className="w-full md:w-auto md:min-w-[320px]">
                <BlogSearch initialQuery={q} />
              </div>
            </div>
          </header>

          {/* Filters & Categories */}
          {hasTaxonomy && (
            <nav aria-label={translate(locale, 'blog.filters')} className="mb-8 space-y-3">
              {taxonomy.categories.length > 0 && (
                <ul className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href={link({ tag, q })} className={chip(!category)}>
                      {translate(locale, 'blog.all')}
                    </Link>
                  </li>
                  {taxonomy.categories.map((item) => (
                    <li key={item.id}>
                      <Link href={link({ category: item.slug, tag, q })} className={chip(category === item.slug)}>
                        {item.name} <span className="ml-1.5 opacity-60 text-xs">{item.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {taxonomy.tags.length > 0 && (
                <ul className="flex flex-wrap items-center gap-2 pt-1">
                  {taxonomy.tags.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={link({ category, tag: tag === item.slug ? undefined : item.slug, q })}
                        className={chip(tag === item.slug)}
                      >
                        #{item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          )}

          {/* Active Filters Bar */}
          {isFiltered && (
            <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--l)] bg-[var(--s)]/40 p-3 text-xs text-[var(--m)]">
              <span className="font-medium text-[var(--t)]">{translate(locale, 'blog.filters')}:</span>

              {q && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--l)] bg-[var(--bg)] px-3 py-1 text-[var(--t)]">
                  «{q}»
                  <Link href={link({ category, tag })} aria-label="Remove search filter" className="hover:text-[var(--b)]">
                    <X className="h-3 w-3" />
                  </Link>
                </span>
              )}

              {activeCategory && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--l)] bg-[var(--bg)] px-3 py-1 text-[var(--t)]">
                  {activeCategory.name}
                  <Link href={link({ tag, q })} aria-label="Remove category filter" className="hover:text-[var(--b)]">
                    <X className="h-3 w-3" />
                  </Link>
                </span>
              )}

              {activeTag && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--l)] bg-[var(--bg)] px-3 py-1 text-[var(--t)]">
                  #{activeTag.name}
                  <Link href={link({ category, q })} aria-label="Remove tag filter" className="hover:text-[var(--b)]">
                    <X className="h-3 w-3" />
                  </Link>
                </span>
              )}

              <Link
                href={base}
                className="ml-auto inline-flex items-center text-xs font-semibold text-[var(--b)] hover:underline"
              >
                {translate(locale, 'blog.empty.reset')}
              </Link>
            </div>
          )}

          {/* Articles Grid or Rich Empty State */}
          {list.articles.length === 0 ? (
            <div className="my-12 flex flex-col items-center justify-center rounded-[28px] border border-[var(--l)] bg-[var(--s)] p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--l)] bg-[var(--bg)] text-[var(--m)]">
                <SearchX className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[var(--t)]">
                {isFiltered ? translate(locale, 'blog.empty.desc') : translate(locale, 'blog.empty')}
              </h2>
              {isFiltered && (
                <Link
                  href={base}
                  className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--t)] bg-[var(--t)] px-5 py-2 text-xs font-semibold text-[var(--bg)] hover:opacity-90 transition-opacity"
                >
                  {translate(locale, 'blog.empty.reset')}
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.articles.map((article, index) => {
                // Перша стаття головної сторінки блогу (без фільтрів) показується великою.
                const isFeatured = index === 0 && page === 1 && !tag && !category && !q && list.articles.length > 1

                return (
                  <li key={article.id} className={isFeatured ? 'sm:col-span-2 lg:col-span-3' : undefined}>
                    <ArticleCardView
                      article={article}
                      locale={locale}
                      priority={index < 2 && page === 1}
                      featured={isFeatured}
                    />
                  </li>
                )
              })}
            </ul>
          )}

          {/* Pagination */}
          {list.pages > 1 && (
            <nav aria-label={translate(locale, 'blog.pagination')} className="mt-12 flex items-center justify-between gap-3 text-sm">
              {page > 1 ? (
                <Link rel="prev" href={link({ category, tag, q, page: page - 1 })} className={chip(false)}>
                  {translate(locale, 'blog.prev')}
                </Link>
              ) : <span />}
              <span className="text-[var(--m)]">{translate(locale, 'blog.page', { page, pages: list.pages })}</span>
              {page < list.pages ? (
                <Link rel="next" href={link({ category, tag, q, page: page + 1 })} className={chip(false)}>
                  {translate(locale, 'blog.next')}
                </Link>
              ) : <span />}
            </nav>
          )}

          {/* Newsletter Section */}
          <BlogNewsletter />
        </div>
      </section>
    </>
  )
}
