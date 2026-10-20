import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import type { ReactElement } from 'react'

import type { Locale } from '@/src/shared/i18n/i18n-store'
import { withLocale } from '@/src/shared/i18n/paths'
import { translate } from '@/src/shared/i18n/translate'
import type { ArticleCard } from '../blog.types'

export const formatDate = (value: string, locale: Locale): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))

// Картка статті у списку й у "Читайте також". Зображення з відомими розмірами: сторінка не стрибає.
export function ArticleCardView({
  article,
  locale,
  priority = false,
  featured = false,
}: {
  article: ArticleCard
  locale: Locale
  priority?: boolean
  // Велика горизонтальна картка для першої статті списку.
  featured?: boolean
}): ReactElement {
  const href = withLocale(`/blog/${article.slug}`, locale)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--l)] bg-[var(--s)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-2xl">
      <Link href={href} className={featured ? 'flex h-full flex-col lg:flex-row' : 'flex h-full flex-col'} aria-label={article.title}>
        <div className={featured ? 'relative overflow-hidden aspect-[1200/630] w-full lg:aspect-auto lg:w-3/5' : 'relative overflow-hidden aspect-[1200/630] w-full'}>
          {article.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover.url}
              alt={article.cover.alt}
              width={article.cover.width}
              height={article.cover.height}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className="relative flex h-full w-full items-center justify-center overflow-hidden transition-transform duration-500 ease-out group-hover:scale-105"
              style={{
                background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--b) 25%, transparent), var(--bg) 80%)',
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-15"
                style={{
                  backgroundImage: 'radial-gradient(var(--m) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />
              <span className="font-mono text-2xl font-black tracking-widest text-[var(--m)] opacity-40">
                XIK_
              </span>
            </div>
          )}

          {featured && (
            <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-[var(--t)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--bg)] shadow-md">
              <Sparkles className="h-3.5 w-3.5 text-[var(--b)]" />
              <span>{translate(locale, 'blog.featured')}</span>
            </div>
          )}
        </div>

        <div className={featured ? 'flex flex-1 flex-col justify-between p-6 lg:p-10' : 'flex flex-1 flex-col justify-between p-5'}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
                {[article.category?.name, translate(locale, 'blog.minRead', { count: article.readingMinutes })]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            <h2 className={featured ? 'my-3 text-2xl font-bold leading-tight tracking-tight text-[var(--t)] transition-colors group-hover:text-[var(--b)] lg:text-3xl' : 'my-2 text-xl font-bold leading-tight tracking-tight text-[var(--t)] transition-colors group-hover:text-[var(--b)]'}>
              {article.title}
            </h2>

            <p className={featured ? 'line-clamp-4 text-base leading-relaxed text-[var(--m)] lg:text-lg' : 'line-clamp-3 text-sm leading-relaxed text-[var(--m)]'}>
              {article.excerpt}
            </p>

            {article.tags && article.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full border border-[var(--l)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--m)] transition-colors group-hover:border-[var(--m)]"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-4 text-xs font-semibold text-[var(--b)]">
            <span className="flex items-center gap-1">
              {translate(locale, 'blog.readMore')}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
            {article.publishedAt && (
              <time dateTime={article.publishedAt} className="text-[var(--m)]">
                {formatDate(article.publishedAt, locale)}
              </time>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
