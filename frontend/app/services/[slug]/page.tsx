import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCatalogItem, getItemsByType } from '@/src/features/catalog/data/catalog-items'
import { CatalogItemDetail } from '@/src/features/catalog/components/CatalogItemDetail'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

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
    title: `${item.title} — ${item.subtitle}`,
    description: item.description,
    pathname: `/services/${item.slug}`,
  })
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params
  const item = getCatalogItem(slug)

  if (!item || item.type !== 'service') {
    notFound()
  }

  return <CatalogItemDetail item={item} />
}
