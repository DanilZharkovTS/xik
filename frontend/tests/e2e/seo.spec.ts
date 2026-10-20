import { expect, test } from '../support/test'

import { truncate } from '../../src/shared/seo/truncate'
import { siteConfig } from '../../src/config/site'
import { PRODUCTS } from '../support/catalog'

const STATIC_METADATA = [
  {
    path: '/',
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    canonical: 'https://xik.app',
  },
  {
    path: '/products',
    title: 'AI Software Products | XIK',
    description:
      'Independent software products by XIK: observability, licensing, security testing and lead monitoring, built around real operational workflows.',
    canonical: 'https://xik.app/products',
  },
] as const

async function readJsonLd(page: import('@playwright/test').Page) {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents()

  return scripts.map((script) => JSON.parse(script) as Record<string, unknown>)
}

test.describe('metadata and indexing endpoints', () => {
  test('legacy About redirects to the canonical home section', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveURL('/#about')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', siteConfig.origin)
    await expect(page.locator('#about h2')).toBeVisible()
  })
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
        `${truncate(`${product.name} — ${product.categoryLabel}`, 52)} | XIK`,
      )
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        truncate([product.shortDescription, product.tagline].filter(Boolean).join(' '), 158),
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
        `${truncate(`${product.name} — ${product.categoryLabel}`, 52)} | XIK`,
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
        description: truncate(product.description, 300),
        url: productUrl,
      })
      const offer = application?.offers as { price: number } | undefined
      if (offer) await expect(page.locator('main')).toContainText(`$${Number(offer.price)}`)
      else expect(await page.locator('main').innerText()).not.toMatch(/\$\d/)
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
        `${siteConfig.origin}/#products`,
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
      `${siteConfig.origin}/services`,
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
      background_color: '#050507',
      theme_color: '#050507',
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
