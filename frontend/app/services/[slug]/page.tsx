import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCatalogItem, getItemsByType } from '@/src/features/catalog/data/catalog-items'
import { CatalogItemDetail } from '@/src/features/catalog/components/CatalogItemDetail'
import { getAbsoluteUrl } from '@/src/config/site'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'
import { JsonLd } from '@/src/shared/seo/json-ld'
import { truncate } from '@/src/shared/seo/truncate'

type ServicePageProps = {
  params: Promise<{
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
  const item = getCatalogItem(slug)

  if (!item || item.type !== 'service') {
    return createPageMetadata({
      title: 'Service Not Found',
      description: 'The requested engineering service could not be located in XIK Studio.',
      pathname: `/services/${slug}`,
    })
  }

  return createPageMetadata({
    title: truncate(`${item.title} — ${item.category}`, 52),
    description: truncate([item.subtitle, item.tagline].filter(Boolean).join(' '), 158),
    pathname: `/services/${item.slug}`,
    image: `/services/${item.slug}/opengraph-image`,
  })
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params
  const item = getCatalogItem(slug)

  if (!item || item.type !== 'service') {
    notFound()
  }

  const related = getItemsByType('service')
    .filter((other) => other.slug !== item.slug)
    .slice(0, 3)
    .map((other) => ({
      href: `/services/${other.slug}`,
      title: other.title,
      subtitle: other.subtitle,
    }))

  const url = getAbsoluteUrl(`/services/${item.slug}`)

  return (
    <>
      <JsonLd
        id="service-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: item.title,
          description: truncate(item.description, 300),
          url,
          serviceType: item.category,
          provider: { '@type': 'Organization', name: 'XIK', url: getAbsoluteUrl('/') },
        }}
      />
      <JsonLd
        id="breadcrumb-structured-data"
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'XIK', item: getAbsoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Services', item: getAbsoluteUrl('/#services') },
            { '@type': 'ListItem', position: 3, name: item.title, item: url },
          ],
        }}
      />
      <CatalogItemDetail item={item} related={related} />
    </>
  )
}
