import type { Metadata } from 'next'

import { CatalogListPage } from '@/src/features/catalog/components/CatalogListPage'
import { getItemsByType, localizeItem } from '@/src/features/catalog/data/catalog-items'
import { withLocale } from '@/src/shared/i18n/paths'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)

  return createPageMetadata({
    title: translate(locale, 'list.services.title'),
    description: translate(locale, 'list.services.meta'),
    pathname: '/services',
    locale,
  })
}

export default async function ServicesPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const services = getItemsByType('service').map((service) => localizeItem(service, locale))

  return (
    <CatalogListPage
      pathname="/services"
      locale={locale}
      eyebrow={translate(locale, 'list.services.eyebrow')}
      title={translate(locale, 'list.services.title')}
      intro={translate(locale, 'list.services.intro')}
      cta={translate(locale, 'list.services.cta')}
      emptyText={translate(locale, 'list.services.empty')}
      entries={services.map((service) => ({
        href: withLocale(`/services/${service.slug}`, locale),
        name: service.title,
        description: service.subtitle,
        eyebrow: service.category,
      }))}
    />
  )
}
