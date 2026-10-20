import { expect, test } from '../support/test'

import { PRODUCTS } from '../support/catalog'
import { getHorizontalOverflow } from '../support/runtime'

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
] as const

const RESPONSIVE_ROUTES = [
  '/',
  '/products',
  '/about',
  `/products/${PRODUCTS[0].slug}`,
] as const

test.describe('responsive content and layout', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.width}px has no overflow or broken public images`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)

      for (const route of RESPONSIVE_ROUTES) {
        await page.goto(route)

        expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(0)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect
          .poll(() =>
            page.locator('img').evaluateAll((images) =>
              images.every((element) => {
                const image = element as HTMLImageElement

                return (
                  image.complete &&
                  image.naturalWidth > 0 &&
                  image.naturalHeight > 0
                )
              }),
            ),
          )
          .toBe(true)
      }
    })
  }

  test('mobile About illustration does not cover its content', async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 320,
      height: 568,
    })
    await page.goto('/about')

    const overlapsText = await page.evaluate(() => {
      const image = document.querySelector('main img')

      if (!image) {
        return false
      }

      const imageBox = image.getBoundingClientRect()
      const textElements = Array.from(
        document.querySelectorAll('main h1, main h2, main p'),
      ).filter(
        (element) =>
          element.getBoundingClientRect().width > 0 &&
          element.getBoundingClientRect().height > 0,
      )

      return textElements.some((element) => {
        const textBox = element.getBoundingClientRect()

        return !(
          imageBox.right <= textBox.left ||
          imageBox.left >= textBox.right ||
          imageBox.bottom <= textBox.top ||
          imageBox.top >= textBox.bottom
        )
      })
    })

    expect(overlapsText).toBe(false)
    await expect(
      page.getByText(
        'XIK is an independent product and AI engineering lab building operational software, autonomous systems and reusable infrastructure. From property operations and observability to AI security, agent runtimes and real-time assistants, every system is built around a concrete job.',
      ),
    ).toBeVisible()
  })

  test('mobile product details retain description and features', async ({
    page,
  }) => {
    const product = PRODUCTS[0]

    await page.setViewportSize({
      width: 320,
      height: 568,
    })
    await page.goto(`/products/${product.slug}`)

    await expect(page.getByText(product.description)).toBeVisible()

    for (const feature of product.features) {
      await expect(page.getByText(feature)).toBeVisible()
    }
  })

  test('landscape mobile remains usable without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 844,
      height: 390,
    })
    await page.goto(`/products/${PRODUCTS[0].slug}`)

    expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(0)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('public content gutters remain clear at every breakpoint', async ({
    page,
  }) => {
    for (const width of [375, 390, 768, 1440]) {
      await page.setViewportSize({
        width,
        height: width < 768 ? 844 : 900,
      })
      await page.goto(`/products/${PRODUCTS[0].slug}`)

      // The current public design has no decorative gutter overlay.
      await expect(page.locator('[data-scroll-chomper]')).toHaveCount(0)
      expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(0)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
  })
})
