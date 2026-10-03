import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
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
}: {
  article: ArticleCard
  locale: Locale
  priority?: boolean
}): ReactElement {
  const href = withLocale(`/blog/${article.slug}`, locale)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--l)] bg-[var(--s)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m)] hover:shadow-xl">
      <Link href={href} className="flex h-full flex-col" aria-label={article.title}>
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
            className="aspect-[1200/630] w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="aspect-[1200/630] w-full"
            style={{ background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--b) 22%, transparent), transparent 60%)' }}
          />
        )}

        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--m)]">
              {[article.category?.name, translate(locale, 'blog.minRead', { count: article.readingMinutes })]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <h2 className="my-2 text-xl font-bold leading-tight tracking-tight text-[var(--t)] transition-colors group-hover:text-[var(--b)]">
              {article.title}
            </h2>
            <p className="line-clamp-3 text-sm leading-relaxed text-[var(--m)]">{article.excerpt}</p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-4 text-xs font-semibold text-[var(--b)]">
            <span className="flex items-center gap-1">
              {translate(locale, 'blog.readMore')}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
            {article.publishedAt && <time dateTime={article.publishedAt} className="text-[var(--m)]">{formatDate(article.publishedAt, locale)}</time>}
          </div>
        </div>
      </Link>
    </article>
  )
}
