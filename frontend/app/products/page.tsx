import type { Metadata } from 'next'

import { fetchCatalog } from '@/src/features/catalog/catalog-api'
import { formatPrice, productHref, statusLabel } from '@/src/features/catalog/catalog-product'
import { CatalogListPage } from '@/src/features/catalog/components/CatalogListPage'
import { createPageMetadata } from '@/src/shared/seo/create-page-metadata'

// Каталог живе в БД і кешується з тегом: сторінка не збирається під час білду.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = createPageMetadata({
  title: 'AI Software Products',
  description:
    'Independent software products by XIK: observability, licensing, security testing and lead monitoring, built around real operational workflows.',
  pathname: '/products',
})

export default async function ProductsPage() {
  const products = await fetchCatalog('product')

  return (
    <CatalogListPage
      pathname="/products"
      eyebrow="Products"
      title="AI Software Products"
      intro="Independent software products built around real operational workflows, infrastructure and measurable outcomes: observability, licensing and entitlements, security testing and lead monitoring."
      cta="Explore product"
      emptyText="Products are coming soon."
      entries={products.map((product) => ({
        href: productHref(product),
        name: product.name,
        description: product.shortDescription,
        eyebrow: [product.categoryLabel ?? 'Product', statusLabel(product.status)].join(' · '),
        price: formatPrice(product) || undefined,
      }))}
    />
  )
}
