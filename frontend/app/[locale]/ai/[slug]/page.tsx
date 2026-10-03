import type { Metadata } from 'next'

import { localeFromParams } from '@/src/shared/i18n/server'
import { ProductPage, productPageMetadata } from '@/src/features/catalog/product-page'

// Сторінки не збираються під час білду (каталог у БД), а кешуються при першому запиті й
// скидаються тегом 'catalog' після змін; година це страховка.
export const revalidate = 3600

export function generateStaticParams(): { slug: string }[] {
  return []
}

type AiPageProps = {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export async function generateMetadata({ params }: AiPageProps): Promise<Metadata> {
  const { slug } = await params
  return productPageMetadata(slug, 'agent', await localeFromParams(params))
}

export default async function AiDetailPage({ params }: AiPageProps) {
  const { slug } = await params
  return <ProductPage slug={slug} kind="agent" locale={await localeFromParams(params)} />
}
