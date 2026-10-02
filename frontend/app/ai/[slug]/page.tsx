import type { Metadata } from 'next'

import { ProductPage, productPageMetadata } from '@/src/features/catalog/product-page'

type AiPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: AiPageProps): Promise<Metadata> {
  const { slug } = await params
  return productPageMetadata(slug, 'agent')
}

export default async function AiDetailPage({ params }: AiPageProps) {
  const { slug } = await params
  return <ProductPage slug={slug} kind="agent" />
}
