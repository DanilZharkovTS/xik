import { fetchArticle } from '@/src/features/blog/blog-api'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'
import { OG_SIZE, renderOgCard } from '@/src/shared/seo/og-card'
import { ogLocale } from '@/src/shared/seo/og-locale'
import { truncate } from '@/src/shared/seo/truncate'

export const alt = 'XIK blog article'
export const size = OG_SIZE
export const contentType = 'image/png'

// Картка для статей без обкладинки. Українська без кирилиці в шрифті сюди не потрапляє (там обкладинка).
export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params
  const locale = await localeFromParams(params)
  const article = await fetchArticle(slug, locale).catch(() => null)
  const cardLocale = ogLocale(locale)

  return renderOgCard({
    eyebrow: translate(cardLocale, 'blog.eyebrow'),
    title: truncate(article?.title ?? 'XIK', 60),
    subtitle: truncate(article?.excerpt ?? 'AI tools with pixel soul', 110),
  })
}
