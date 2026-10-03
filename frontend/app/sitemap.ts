import type { MetadataRoute } from 'next'

import { getAbsoluteUrl } from '@/src/config/site'
import { fetchCatalog } from '@/src/features/catalog/catalog-api'
import { productHref } from '@/src/features/catalog/catalog-product'
import { getItemsByType } from '@/src/features/catalog/data/catalog-items'

// Каталог живе в БД: sitemap збирається на запит (дані беруться з кешу з тегом).
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await fetchCatalog()

  // Дата зміни сторінок-рубрик і головної: остання зміна серед їхніх продуктів.
  const latest = (kind?: 'product' | 'agent'): Date | undefined => {
    const times = catalog
      .filter((product) => !kind || product.kind === kind)
      .map((product) => Date.parse(product.updatedAt))
      .filter((time) => !Number.isNaN(time))

    return times.length > 0 ? new Date(Math.max(...times)) : undefined
  }

  return [
    { url: getAbsoluteUrl('/'), lastModified: latest(), changeFrequency: 'weekly', priority: 1 },
    { url: getAbsoluteUrl('/products'), lastModified: latest('product'), changeFrequency: 'weekly', priority: 0.9 },
    { url: getAbsoluteUrl('/ai'), lastModified: latest('agent'), changeFrequency: 'weekly', priority: 0.9 },
    { url: getAbsoluteUrl('/services'), changeFrequency: 'monthly', priority: 0.8 },
    ...catalog.map((product) => ({
      url: getAbsoluteUrl(productHref(product)),
      lastModified: new Date(product.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...getItemsByType('service').map((service) => ({
      url: getAbsoluteUrl(`/services/${service.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
