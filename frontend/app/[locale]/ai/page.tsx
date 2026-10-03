import type { Metadata } from 'next'

import { fetchCatalog } from '@/src/features/catalog/catalog-api'
import { formatPrice, productHref, statusLabel } from '@/src/features/catalog/catalog-product'
import { CatalogListPage } from '@/src/features/catalog/components/CatalogListPage'
import { withLocale } from '@/src/shared/i18n/paths'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

// Каталог живе в БД і кешується з тегом: сторінка не збирається під час білду.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)

  return createPageMetadata({
    title: translate(locale, 'list.ai.title'),
    description: translate(locale, 'list.ai.meta'),
    pathname: '/ai',
    locale,
  })
}

export default async function Page({ params }: Props) {
  const locale = await localeFromParams(params)
  const items = await fetchCatalog('agent', locale)

  return (
    <CatalogListPage
      pathname="/ai"
      locale={locale}
      eyebrow={translate(locale, 'list.ai.eyebrow')}
      title={translate(locale, 'list.ai.title')}
      intro={translate(locale, 'list.ai.intro')}
      cta={translate(locale, 'list.ai.cta')}
      emptyText={translate(locale, 'list.ai.empty')}
      entries={items.map((item) => ({
        href: withLocale(productHref(item), locale),
        name: item.name,
        description: item.shortDescription,
        eyebrow: [
          item.categoryLabel ?? translate(locale, 'catalog.eyebrow.agent'),
          statusLabel(item.status, locale),
        ].join(' · '),
        price: formatPrice(item, locale) || undefined,
      }))}
    />
  )
}
