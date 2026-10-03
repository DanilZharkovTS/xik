import type { MetadataRoute } from 'next'

import { getAbsoluteUrl, siteConfig } from '@/src/config/site'

// Робочі розділи не мають потрапляти в індекс і витрачати краулінговий бюджет.
const PRIVATE_PATHS = ['/admin', '/outreach', '/dashboard', '/auth', '/account', '/api', '/success', '/blog/preview'].flatMap(
  (path) => [path, `/es${path}`, `/uk${path}`],
)

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: PRIVATE_PATHS,
    },
    sitemap: getAbsoluteUrl('/sitemap.xml'),
    host: siteConfig.origin,
  }
}
