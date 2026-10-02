import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCatalogItem, getItemsByType } from '@/src/features/catalog/data/catalog-items'
import { CatalogItemDetail } from '@/src/features/catalog/components/CatalogItemDetail'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

type ProductPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const products = getItemsByType('product')
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const item = getCatalogItem(slug)

  if (!item || item.type !== 'product') {
    return createPageMetadata({
      title: 'Product Not Found',
      description: 'The requested product could not be located in XIK Studio.',
      pathname: `/products/${slug}`,
    })
  }

  return createPageMetadata({
    title: `${item.title} — ${item.subtitle}`,
    description: item.description,
    pathname: `/products/${item.slug}`,
  })
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params
  const item = getCatalogItem(slug)

  if (!item || item.type !== 'product') {
    notFound()
  }

  return <CatalogItemDetail item={item} />
}
