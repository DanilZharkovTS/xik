import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCatalogItem, getItemsByType, hasTranslation, localizeItem } from '@/src/features/catalog/data/catalog-items'
import { CatalogItemDetail } from '@/src/features/catalog/components/CatalogItemDetail'
import { getAbsoluteUrl } from '@/src/config/site'
import { LOCALES } from '@/src/shared/i18n/i18n-store'
import { localizedPath, withLocale } from '@/src/shared/i18n/paths'
import { localeFromParams } from '@/src/shared/i18n/server'
import { translate } from '@/src/shared/i18n/translate'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'
import { JsonLd } from '@/src/shared/seo/json-ld'
import { truncate } from '@/src/shared/seo/truncate'

type ServicePageProps = {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export async function generateStaticParams() {
  const services = getItemsByType('service')
  return services.map((service) => ({
    slug: service.slug,
  }))
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = await localeFromParams(params)
  const base = getCatalogItem(slug)

  if (!base || base.type !== 'service') {
    return createPageMetadata({
      title: translate(locale, 'detail.notFoundService'),
      description: translate(locale, 'detail.notFoundServiceDesc'),
      pathname: `/services/${slug}`,
      locale,
    })
  }

  const item = localizeItem(base, locale)

  return createPageMetadata({
    title: truncate(`${item.title} — ${item.category}`, 52),
    description: truncate([item.subtitle, item.tagline].filter(Boolean).join(' '), 158),
    pathname: `/services/${item.slug}`,
    locale,
    availableLocales: LOCALES.filter((code) => hasTranslation(item.slug, code)),
    image: `/services/${item.slug}/opengraph-image`,
  })
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params
  const locale = await localeFromParams(params)
  const base = getCatalogItem(slug)

  if (!base || base.type !== 'service') {
    notFound()
  }

  const item = localizeItem(base, locale)

  const related = getItemsByType('service')
    .filter((other) => other.slug !== item.slug)
    .slice(0, 3)
    .map((other) => localizeItem(other, locale))
    .map((other) => ({
      href: withLocale(`/services/${other.slug}`, locale),
      title: other.title,
      subtitle: other.subtitle,
    }))

  const url = getAbsoluteUrl(localizedPath(`/services/${item.slug}`, locale))

  return (
    <>
      <JsonLd
        id="service-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          inLanguage: locale,
          name: item.title,
          description: truncate(item.description, 300),
          url,
          serviceType: item.category,
          provider: { '@type': 'Organization', name: 'XIK', url: getAbsoluteUrl(localizedPath('/', locale)) },
        }}
      />
      <JsonLd
        id="breadcrumb-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'XIK', item: getAbsoluteUrl(localizedPath('/', locale)) },
            { '@type': 'ListItem', position: 2, name: translate(locale, 'detail.section.service'), item: getAbsoluteUrl(`${localizedPath('/', locale)}#services`) },
            { '@type': 'ListItem', position: 3, name: item.title, item: url },
          ],
        }}
      />
      <CatalogItemDetail item={item} related={related} />
    </>
  )
}
