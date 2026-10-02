import { expect, test } from '@playwright/test'

import { siteConfig } from '../../src/config/site'
import { PRODUCTS } from '../../src/features/products/data/products'

const STATIC_METADATA = [
  {
    path: '/',
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    canonical: 'https://xik.app',
  },
  {
    path: '/products',
    title: 'AI Products | XIK',
    description:
      'Explore independent AI tools built by XIK to make development and creative work faster and more focused.',
    canonical: 'https://xik.app/products',
  },
  {
    path: '/about',
    title: 'About Us | XIK',
    description:
      'Meet the two-person team building XIK and its focused AI tools for developers and technical workflows.',
    canonical: 'https://xik.app/about',
  },
] as const

async function readJsonLd(page: import('@playwright/test').Page) {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()

  return scripts.map((script) => JSON.parse(script) as Record<string, unknown>)
}

test.describe('metadata and indexing endpoints', () => {
  for (const metadata of STATIC_METADATA) {
    test(`${metadata.path} exposes complete unique metadata`, async ({
      page,
    }) => {
      await page.goto(metadata.path)

      await expect(page).toHaveTitle(metadata.title)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        metadata.description,
      )
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        metadata.canonical,
      )
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        metadata.title,
      )
      await expect(
        page.locator('meta[property="og:description"]'),
      ).toHaveAttribute('content', metadata.description)
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        metadata.canonical,
      )
      await expect(
        page.locator('meta[name="twitter:card"]'),
      ).toHaveAttribute('content', 'summary_large_image')
      await expect(
        page.locator('meta[name="twitter:title"]'),
      ).toHaveAttribute('content', metadata.title)
      await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute(
        'content',
        /noindex/i,
      )

      const jsonLd = await readJsonLd(page)
      const organization = jsonLd.find(
        (item) => item['@type'] === 'Organization',
      )

      expect(organization).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.name,
        url: siteConfig.origin,
        description: siteConfig.description,
      })
      expect(jsonLd.some((item) => item['@type'] === 'Person')).toBe(false)
    })
  }

  for (const product of PRODUCTS) {
    test(`${product.slug} exposes product metadata and JSON-LD`, async ({
      page,
    }) => {
      const productUrl = `${siteConfig.origin}/products/${product.slug}`

      await page.goto(`/products/${product.slug}`)

      await expect(page).toHaveTitle(
        `${product.name} — AI Tool | XIK`,
      )
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        product.description,
      )
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        productUrl,
      )
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        productUrl,
      )
      await expect(
        page.locator('meta[name="twitter:title"]'),
      ).toHaveAttribute(
        'content',
        `${product.name} — AI Tool | XIK`,
      )

      const jsonLd = await readJsonLd(page)
      const application = jsonLd.find(
        (item) => item['@type'] === 'SoftwareApplication',
      )
      const breadcrumbs = jsonLd.find(
        (item) => item['@type'] === 'BreadcrumbList',
      )

      expect(application).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: product.name,
        description: product.description,
        url: productUrl,
      })
      expect(application).not.toHaveProperty('offers')
      expect(application).not.toHaveProperty('aggregateRating')
      expect(application).not.toHaveProperty('review')
      expect(breadcrumbs).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
      })
      expect(
        (
          breadcrumbs?.itemListElement as Array<{
            item: string
          }>
        ).map((item) => item.item),
      ).toEqual([
        `${siteConfig.origin}/`,
        `${siteConfig.origin}/products`,
        productUrl,
      ])
    })
  }

  test('robots, sitemap, manifest, and Open Graph image are valid', async ({
    request,
  }) => {
    const robotsResponse = await request.get('/robots.txt')
    const robots = await robotsResponse.text()

    expect(robotsResponse.status()).toBe(200)
    expect(robots).toContain('User-Agent: *')
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Sitemap: https://xik.app/sitemap.xml')

    const sitemapResponse = await request.get('/sitemap.xml')
    const sitemap = await sitemapResponse.text()
    const expectedUrls = [
      `${siteConfig.origin}/`,
      `${siteConfig.origin}/products`,
      `${siteConfig.origin}/about`,
      ...PRODUCTS.map(
        (product) => `${siteConfig.origin}/products/${product.slug}`,
      ),
    ]

    expect(sitemapResponse.status()).toBe(200)

    for (const url of expectedUrls) {
      expect(sitemap).toContain(`<loc>${url}</loc>`)
    }

    const manifestResponse = await request.get('/manifest.webmanifest')
    const manifest = await manifestResponse.json()

    expect(manifestResponse.status()).toBe(200)
    expect(manifest).toMatchObject({
      name: 'XIK',
      short_name: 'XIK',
      start_url: '/',
      display: 'standalone',
      background_color: '#050505',
      theme_color: '#050505',
      lang: 'en',
    })

    const openGraphImage = await request.get('/opengraph-image')

    expect(openGraphImage.status()).toBe(200)
    expect(openGraphImage.headers()['content-type']).toContain('image/png')
    expect((await openGraphImage.body()).byteLength).toBeGreaterThan(1_000)

    const icon = await request.get('/icon.svg')

    expect(icon.status()).toBe(200)
    expect(icon.headers()['content-type']).toContain('image/svg+xml')
  })

  test('invalid routes are noindex and do not emit a canonical URL', async ({
    page,
  }) => {
    const response = await page.goto('/products/not-a-real-product')

    expect(response?.status()).toBe(404)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/i,
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
  })
})
