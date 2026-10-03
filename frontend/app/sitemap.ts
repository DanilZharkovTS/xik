import type { MetadataRoute } from 'next'

import { getAbsoluteUrl } from '@/src/config/site'
import { fetchCatalog } from '@/src/features/catalog/catalog-api'
import { productHref } from '@/src/features/catalog/catalog-product'
import { getItemsByType, hasTranslation } from '@/src/features/catalog/data/catalog-items'
import { LOCALES } from '@/src/shared/i18n/i18n-store'
import type { Locale } from '@/src/shared/i18n/i18n-store'
import { localizedPath } from '@/src/shared/i18n/paths'

// Каталог живе в БД: sitemap збирається на запит (дані беруться з кешу з тегом).
export const dynamic = 'force-dynamic'

type Entry = MetadataRoute.Sitemap[number]

// Одна сторінка = запис на кожну її мову, і кожен запис перелічує всі мови (hreflang).
const entries = (
  pathname: string,
  locales: readonly Locale[],
  extra: Pick<Entry, 'lastModified' | 'changeFrequency' | 'priority'>,
): Entry[] => {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, getAbsoluteUrl(localizedPath(pathname, locale))]),
  )

  return locales.map((locale) => ({
    url: getAbsoluteUrl(localizedPath(pathname, locale)),
    alternates: { languages },
    ...extra,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Англійський каталог містить усі продукти разом з переліком їхніх перекладів.
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
    ...entries('/', LOCALES, { lastModified: latest(), changeFrequency: 'weekly', priority: 1 }),
    ...entries('/products', LOCALES, { lastModified: latest('product'), changeFrequency: 'weekly', priority: 0.9 }),
    ...entries('/ai', LOCALES, { lastModified: latest('agent'), changeFrequency: 'weekly', priority: 0.9 }),
    ...entries('/services', LOCALES, { changeFrequency: 'monthly', priority: 0.8 }),
    ...catalog.flatMap((product) =>
      entries(productHref(product), product.availableLocales, {
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      }),
    ),
    ...getItemsByType('service').flatMap((service) =>
      entries(
        `/services/${service.slug}`,
        LOCALES.filter((locale) => hasTranslation(service.slug, locale)),
        { changeFrequency: 'monthly', priority: 0.6 },
      ),
    ),
  ]
}
