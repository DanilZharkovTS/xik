import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { ReactElement } from 'react'

import { getAbsoluteUrl } from '@/src/config/site'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { localizedPath, withLocale } from '@/src/shared/i18n/paths'
import { translate } from '@/src/shared/i18n/translate'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'
import { JsonLd } from '@/src/shared/seo/json-ld'
import { truncate } from '@/src/shared/seo/truncate'
import { fetchCatalog, fetchProduct } from './catalog-api'
import { formatPrice, productHref, toCatalogItem } from './catalog-product'
import type { ProductKind } from './catalog.types'
import { CatalogItemDetail } from './components/CatalogItemDetail'

// /products/[slug] і /ai/[slug] відрізняються лише типом; усе інше спільне й живе тут.
export async function productPageMetadata(
  slug: string,
  kind: ProductKind,
  locale: Locale,
): Promise<Metadata> {
  const product = await fetchProduct(slug, locale)

  if (!product) {
    const key = kind === 'agent' ? 'Agent' : 'Product'

    return createPageMetadata({
      title: translate(locale, `detail.notFound${key}`),
      description: translate(locale, `detail.notFound${key}Desc`),
      pathname: `${kind === 'agent' ? '/ai' : '/products'}/${slug}`,
      locale,
    })
  }

  const pathname = productHref(product)

  // Заголовок до ~60 символів (ще додається "| XIK"), опис до ~160: так показує видача.
  return createPageMetadata({
    title: truncate(
      `${product.name} — ${product.categoryLabel ?? translate(locale, `catalog.type.${kind}`)}`,
      52,
    ),
    description: truncate(
      [product.shortDescription, product.tagline].filter(Boolean).join(' '),
      158,
    ),
    pathname,
    locale,
    // Без перекладу сторінка в іншій мові показує англійський текст: її закрито від індексу.
    availableLocales: product.availableLocales,
    image: `${pathname}/opengraph-image`,
  })
}

export async function ProductPage({
  slug,
  kind,
  locale,
}: {
  slug: string
  kind: ProductKind
  locale: Locale
}): Promise<ReactElement> {
  const product = await fetchProduct(slug, locale)

  if (!product) notFound()

  // Продукт відкрили за адресою іншого блоку (наприклад, агента в /products): ведемо на правильну.
  if (product.kind !== kind) redirect(withLocale(productHref(product), locale))

  const related = (await fetchCatalog(undefined, locale))
    .filter((other) => other.slug !== product.slug)
    .slice(0, 3)
    .map((other) => ({
      href: withLocale(productHref(other), locale),
      title: other.name,
      subtitle: other.shortDescription,
    }))

  const url = getAbsoluteUrl(localizedPath(productHref(product), locale))
  const hasPrice = product.showPrice && product.price !== null && product.currency !== null

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    inLanguage: locale,
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
      { '@type': 'ListItem', position: 1, name: 'XIK', item: getAbsoluteUrl(localizedPath('/', locale)) },
      {
        '@type': 'ListItem',
        position: 2,
        name: translate(locale, kind === 'agent' ? 'detail.section.agent' : 'detail.section.product'),
        item: getAbsoluteUrl(`${localizedPath('/', locale)}${kind === 'agent' ? '#ai' : '#products'}`),
      },
      { '@type': 'ListItem', position: 3, name: product.name, item: url },
    ],
  }

  return (
    <>
      <JsonLd data={structuredData} id="product-structured-data" />
      <JsonLd data={breadcrumbs} id="breadcrumb-structured-data" />
      <CatalogItemDetail
        item={toCatalogItem(product, locale)}
        related={related}
        purchase={
          product.isPurchasable
            ? { productId: product.id, priceLabel: formatPrice(product, locale) }
            : undefined
        }
      />
    </>
  )
}