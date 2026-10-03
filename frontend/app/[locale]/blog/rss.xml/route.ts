import { getAbsoluteUrl, siteText } from '@/src/config/site'
import { fetchFeed } from '@/src/features/blog/blog-api'
import { localeFromParams } from '@/src/shared/i18n/server'
import { localizedPath } from '@/src/shared/i18n/paths'
import { translate } from '@/src/shared/i18n/translate'

export const revalidate = 300

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

// RSS окремо для кожної мови: читачі й агрегатори бачать лише статті своєю мовою.
export async function GET(_request: Request, context: { params: Promise<{ locale: string }> }): Promise<Response> {
  const locale = await localeFromParams(context.params)
  const feed = await fetchFeed()

  const items = feed
    .flatMap((article) => {
      const translation = article.translations.find((item) => item.locale === locale)
      return translation ? [{ article, translation }] : []
    })
    .slice(0, 50)
    .map(({ article, translation }) => {
      const url = getAbsoluteUrl(localizedPath(`/blog/${translation.slug}`, locale))

      return `    <item>
      <title>${escapeXml(translation.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(translation.excerpt)}</description>${
        article.cover ? `\n      <enclosure url="${escapeXml(article.cover.url)}" type="image/jpeg" length="0" />` : ''
      }
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(translate(locale, 'blog.title'))}</title>
    <link>${escapeXml(getAbsoluteUrl(localizedPath('/blog', locale)))}</link>
    <description>${escapeXml(siteText(locale).description)}</description>
    <language>${locale}</language>
    <atom:link href="${escapeXml(getAbsoluteUrl(localizedPath('/blog/rss.xml', locale)))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
