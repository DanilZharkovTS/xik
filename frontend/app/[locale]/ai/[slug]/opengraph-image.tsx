import { fetchProduct } from '@/src/features/catalog/catalog-api'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'
import { OG_SIZE, renderOgCard } from '@/src/shared/seo/og-card'
import { ogLocale } from '@/src/shared/seo/og-locale'
import { truncate } from '@/src/shared/seo/truncate'

export const alt = 'XIK ai agent'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params
  const locale = ogLocale(await localeFromParams(params))
  const product = await fetchProduct(slug, locale)

  return renderOgCard({
    eyebrow: translate(locale, 'catalog.og.agent'),
    title: product?.name ?? 'XIK',
    subtitle: truncate(product?.tagline ?? product?.shortDescription ?? 'AI tools with pixel soul', 110),
  })
}
