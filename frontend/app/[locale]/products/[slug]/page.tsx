import type { Metadata } from 'next'

import { localeFromParams } from '@/src/shared/i18n/server'
import { ProductPage, productPageMetadata } from '@/src/features/catalog/product-page'

// Каталог живе в БД і кешується з тегом: сторінка не збирається під час білду.
export const dynamic = 'force-dynamic'

type ProductPageProps = {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  return productPageMetadata(slug, 'product', await localeFromParams(params))
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params
  return <ProductPage slug={slug} kind="product" locale={await localeFromParams(params)} />
}
