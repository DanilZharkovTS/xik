import { getCatalogItem, localizeItem } from '@/src/features/catalog/data/catalog-items'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'
import { OG_SIZE, renderOgCard } from '@/src/shared/seo/og-card'
import { ogLocale } from '@/src/shared/seo/og-locale'
import { truncate } from '@/src/shared/seo/truncate'

export const alt = 'XIK engineering service'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params
  const locale = ogLocale(await localeFromParams(params))
  const base = getCatalogItem(slug)
  const item = base ? localizeItem(base, locale) : null

  return renderOgCard({
    eyebrow: translate(locale, 'catalog.og.service'),
    title: item?.title ?? 'XIK',
    subtitle: truncate(item?.tagline ?? item?.subtitle ?? 'AI tools with pixel soul', 110),
  })
}
