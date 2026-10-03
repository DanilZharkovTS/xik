import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { ReactElement } from 'react'

import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'
import { fetchCatalog, fetchProduct } from './catalog-api'
import { formatPrice, productHref, toCatalogItem } from './catalog-product'
import type { ProductKind } from './catalog.types'
import { CatalogItemDetail } from './components/CatalogItemDetail'

// /products/[slug] і /ai/[slug] відрізняються лише типом; усе інше спільне й живе тут.
const NOT_FOUND_TEXT: Record<ProductKind, { title: string; description: string }> = {
  product: {
    title: 'Product Not Found',
    description: 'The requested product could not be located in XIK Studio.',
  },
  agent: {
    title: 'Agent Not Found',
    description: 'The requested AI agent could not be located in XIK Studio.',
  },
}

export async function productPageMetadata(slug: string, kind: ProductKind): Promise<Metadata> {
  const product = await fetchProduct(slug)

  if (!product) {
    return createPageMetadata({ ...NOT_FOUND_TEXT[kind], pathname: `${kind === 'agent' ? '/ai' : '/products'}/${slug}` })
  }

  return createPageMetadata({
    title: `${product.name} — ${product.shortDescription}`,
    description: product.description,
    pathname: productHref(product),
  })
}

export async function ProductPage({
  slug,
  kind,
}: {
  slug: string
  kind: ProductKind
}): Promise<ReactElement> {
  const product = await fetchProduct(slug)

  if (!product) notFound()

  // Продукт відкрили за адресою іншого блоку (наприклад, агента в /products): ведемо на правильну.
  if (product.kind !== kind) redirect(productHref(product))

  const related = (await fetchCatalog())
    .filter((other) => other.slug !== product.slug)
    .slice(0, 3)
    .map((other) => ({
      href: productHref(other),
      title: other.name,
      subtitle: other.shortDescription,
    }))

  return (
    <CatalogItemDetail
      item={toCatalogItem(product)}
      related={related}
      purchase={
        product.isPurchasable
          ? { productId: product.id, priceLabel: formatPrice(product) }
          : undefined
      }
    />
  )
}
