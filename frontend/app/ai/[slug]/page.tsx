import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCatalogItem, getItemsByType } from '@/src/features/catalog/data/catalog-items'
import { CatalogItemDetail } from '@/src/features/catalog/components/CatalogItemDetail'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

type AiPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const agents = getItemsByType('agent')
  return agents.map((agent) => ({
    slug: agent.slug,
  }))
}

export async function generateMetadata({ params }: AiPageProps): Promise<Metadata> {
  const { slug } = await params
  const item = getCatalogItem(slug)

  if (!item || item.type !== 'agent') {
    return createPageMetadata({
      title: 'Agent Not Found',
      description: 'The requested AI agent could not be located in XIK Studio.',
      pathname: `/ai/${slug}`,
    })
  }

  return createPageMetadata({
    title: `${item.title} — ${item.subtitle}`,
    description: item.description,
    pathname: `/ai/${item.slug}`,
  })
}

export default async function AiDetailPage({ params }: AiPageProps) {
  const { slug } = await params
  const item = getCatalogItem(slug)

  if (!item || item.type !== 'agent') {
    notFound()
  }

  return <CatalogItemDetail item={item} />
}
