import type { MetadataRoute } from 'next'

import { getAbsoluteUrl } from '@/src/config/site'

const STATIC_PATHS = ['/'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = STATIC_PATHS.map((pathname) => ({
    url: getAbsoluteUrl(pathname),
  }))

  return [...staticPages]
}
