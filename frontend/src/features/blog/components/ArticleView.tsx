import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactElement } from 'react'

import { getAbsoluteUrl } from '@/src/config/site'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { LocaleAlternates } from '@/src/shared/i18n/alternates'
import { localizedPath, withLocale } from '@/src/shared/i18n/paths'
import { translate } from '@/src/shared/i18n/translate'
import { JsonLd } from '@/src/shared/seo/json-ld'
import type { Article } from '../blog.types'
import { tableOfContents } from '../headings'
import { ArticleBlocks } from './ArticleBlocks'
import { ArticleCardView, formatDate } from './ArticleCardView'
import { ReadingProgress } from './ReadingProgress'
import { ShareButtons } from './ShareButtons'

export const articlePath = (slug: string): string => `/blog/${slug}`

// Сторінка статті: заголовок, зміст, блоки, поширення, "Читайте також" і розмітка BlogPosting.
export function ArticleView({ article, locale }: { article: Article; locale: Locale }): ReactElement {
  const { items: toc, ids } = tableOfContents(article.blocks)
  const t = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate(locale, key, params)

  const url = getAbsoluteUrl(localizedPath(articlePath(article.slug), locale))
  const homeUrl = getAbsoluteUrl(localizedPath('/', locale))
  const blogUrl = getAbsoluteUrl(localizedPath('/blog', locale))

  const alternatePaths = Object.fromEntries(
    Object.entries(article.alternates).map(([code, slug]) => [code, articlePath(slug)]),
  )

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    inLanguage: locale,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    ...(article.cover ? { image: [article.cover.url] } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    dateModified: article.updatedAt,
    ...(article.keywords.length > 0 ? { keywords: article.keywords.join(', ') } : {}),
    ...(article.category ? { articleSection: article.category.name } : {}),
    author: article.author
      ? { '@type': 'Person', name: article.author.name }
      : { '@type': 'Organization', name: 'XIK', url: homeUrl },
    publisher: {
      '@type': 'Organization',
      name: 'XIK',
      url: homeUrl,
      logo: { '@type': 'ImageObject', url: getAbsoluteUrl('/icon.svg') },
    },
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'XIK', item: homeUrl },
      { '@type': 'ListItem', position: 2, name: t('blog.eyebrow'), item: blogUrl },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  }

  return (
    <>
      {!article.isPreview && <JsonLd data={structuredData} id="article-structured-data" />}
      {!article.isPreview && <JsonLd data={breadcrumbs} id="breadcrumb-structured-data" />}
      <LocaleAlternates paths={alternatePaths} />

      <article className="px-4 py-10 sm:px-6 md:py-16">
        <ReadingProgress targetId="article-body" />

        <div className="mx-auto max-w-[1068px]">
          <div className="mx-auto max-w-[780px] xl:mx-0">
            {article.isPreview && (
              <p role="status" className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-[var(--t)]">
                {t('blog.preview')}
              </p>
            )}

            <nav aria-label={t('site.breadcrumb')} className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--m)]">
              <Link href={withLocale('/', locale)} className="hover:text-[var(--t)]">XIK</Link>
              <span aria-hidden="true">/</span>
              <Link href={withLocale('/blog', locale)} className="hover:text-[var(--t)]">{t('blog.eyebrow')}</Link>
            </nav>

            <header>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
                {[article.category?.name, t('blog.minRead', { count: article.readingMinutes })].filter(Boolean).join(' · ')}
              </p>
              <h1 className="mt-3 text-[clamp(32px,5.5vw,56px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--t)]">
                {article.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-[var(--m)] md:text-xl">{article.excerpt}</p>

              <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--m)]">
                {article.author && <span className="font-medium text-[var(--t)]">{t('blog.by', { name: article.author.name })}</span>}
                {article.publishedAt && (
                  <time dateTime={article.publishedAt}>{t('blog.published', { date: formatDate(article.publishedAt, locale) })}</time>
                )}
                {new Date(article.updatedAt).getTime() - new Date(article.publishedAt ?? article.updatedAt).getTime() > 86_400_000 && (
                  <time dateTime={article.updatedAt}>{t('blog.updated', { date: formatDate(article.updatedAt, locale) })}</time>
                )}
              </p>
            </header>
          </div>

          {article.cover && (
            // Обкладинка ширша за текст; фіксоване співвідношення, щоб довільний знімок не розтягував сторінку.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover.url}
              alt={article.cover.alt}
              width={article.cover.width}
              height={article.cover.height}
              fetchPriority="high"
              decoding="async"
              className="mt-8 aspect-[1200/630] w-full rounded-3xl border border-[var(--l)] object-cover"
            />
          )}

          <div className="mt-8 xl:grid xl:grid-cols-[minmax(0,780px)_240px] xl:gap-12">
            <div id="article-body" className="mx-auto min-w-0 max-w-[780px] xl:mx-0">
              {toc.length >= 3 && (
                <nav aria-label={t('blog.toc')} className="mb-6 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-5 xl:hidden">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">{t('blog.toc')}</p>
                  <ol className="mt-3 space-y-1.5 text-sm">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === 3 ? 'pl-4' : undefined}>
                        <a href={`#${item.id}`} className="text-[var(--t)] underline-offset-2 hover:text-[var(--b)] hover:underline">
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <ArticleBlocks blocks={article.blocks} locale={locale} anchors={ids} />

          {article.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    href={`${withLocale('/blog', locale)}?tag=${tag.slug}`}
                    className="inline-flex min-h-9 items-center rounded-full border border-[var(--l)] px-3.5 text-sm text-[var(--m)] transition-colors hover:border-[var(--t)] hover:text-[var(--t)]"
                  >
                    #{tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <section aria-label={t('blog.share')} className="mt-8 border-t border-[var(--l)] pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--m)]">{t('blog.share')}</p>
            <ShareButtons url={url} title={article.title} />
          </section>

          <Link
            href={withLocale('/blog', locale)}
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--m)] hover:text-[var(--t)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('blog.back')}
          </Link>
            </div>

            {toc.length >= 3 && (
              <aside className="hidden xl:block">
                <nav aria-label={t('blog.toc')} className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto border-l border-[var(--l)] pl-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--m)]">{t('blog.toc')}</p>
                  <ol className="mt-3 space-y-2 text-sm leading-snug">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === 3 ? 'pl-3' : undefined}>
                        <a href={`#${item.id}`} className="text-[var(--m)] underline-offset-2 transition-colors hover:text-[var(--t)] hover:underline">
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>
            )}
          </div>
        </div>

        {article.related.length > 0 && (
          <section aria-labelledby="related-heading" className="mx-auto mt-16 max-w-[1100px]">
            <h2 id="related-heading" className="mb-5 text-xs font-semibold uppercase tracking-wider text-[var(--m)]">
              {t('blog.related')}
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {article.related.map((item) => (
                <li key={item.id}>
                  <ArticleCardView article={item} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  )
}
