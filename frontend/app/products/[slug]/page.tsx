import type { Metadata } from 'next'

import { ProductPage, productPageMetadata } from '@/src/features/catalog/product-page'

type ProductPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  return productPageMetadata(slug, 'product')
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params
  return <ProductPage slug={slug} kind="product" />
}
