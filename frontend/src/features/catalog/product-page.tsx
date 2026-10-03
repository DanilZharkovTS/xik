import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { ReactElement } from 'react'

import { getAbsoluteUrl } from '@/src/config/site'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'
import { JsonLd } from '@/src/shared/seo/json-ld'
import { truncate } from '@/src/shared/seo/truncate'
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

  const pathname = productHref(product)

  // Заголовок до ~60 символів (ще додається "| XIK"), опис до ~160: так показує видача.
  return createPageMetadata({
    title: truncate(
      `${product.name} — ${product.categoryLabel ?? (kind === 'agent' ? 'AI Agent' : 'Software Product')}`,
      52,
    ),
    description: truncate(
      [product.shortDescription, product.tagline].filter(Boolean).join(' '),
      158,
    ),
    pathname,
    image: `${pathname}/opengraph-image`,
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

  const url = getAbsoluteUrl(productHref(product))
  const hasPrice = product.showPrice && product.price !== null && product.currency !== null

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: truncate(product.description, 300),
    url,
    applicationCategory: 'BusinessApplication',
    ...(product.categoryLabel ? { applicationSubCategory: product.categoryLabel } : {}),
    ...(product.demoUrl ? { installUrl: product.demoUrl } : {}),
    // Ціну в розмітці лише коли її показано на сторінці: розмітка має збігатися з видимим вмістом.
    ...(hasPrice
      ? {
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: product.currency,
            availability: product.isPurchasable
              ? 'https://schema.org/InStock'
              : 'https://schema.org/PreOrder',
            url,
          },
        }
      : {}),
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'XIK', item: getAbsoluteUrl('/') },
      {
        '@type': 'ListItem',
        position: 2,
        name: kind === 'agent' ? 'AI Agents' : 'Products',
        item: getAbsoluteUrl(kind === 'agent' ? '/#ai' : '/#products'),
      },
      { '@type': 'ListItem', position: 3, name: product.name, item: url },
    ],
  }

  return (
    <>
      <JsonLd data={structuredData} id="product-structured-data" />
      <JsonLd data={breadcrumbs} id="breadcrumb-structured-data" />
      <CatalogItemDetail
        item={toCatalogItem(product)}
        related={related}
        purchase={
          product.isPurchasable
            ? { productId: product.id, priceLabel: formatPrice(product) }
            : undefined
        }
      />
    </>
  )
}