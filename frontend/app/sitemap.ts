import type { MetadataRoute } from 'next'

import { getAbsoluteUrl } from '@/src/config/site'
import { fetchCatalog } from '@/src/features/catalog/catalog-api'
import { productHref } from '@/src/features/catalog/catalog-product'
import { getItemsByType } from '@/src/features/catalog/data/catalog-items'

const STATIC_PATHS = ['/'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog] = await Promise.all([fetchCatalog()])

  const paths = [
    ...STATIC_PATHS,
    ...catalog.map((product) => productHref(product)),
    ...getItemsByType('service').map((service) => `/services/${service.slug}`),
  ]

  return paths.map((pathname) => ({ url: getAbsoluteUrl(pathname) }))
}
