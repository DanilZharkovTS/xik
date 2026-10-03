import { expect, test } from '@playwright/test'

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
        return true
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
        'We build AI-powered tools that solve real problems and make complex work easier.',
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

  test('ScrollChomper stays outside critical content gutters', async ({
    page,
  }) => {
    for (const width of [375, 390, 768, 1440]) {
      await page.setViewportSize({
        width,
        height: width < 768 ? 844 : 900,
      })
      await page.goto(`/products/${PRODUCTS[0].slug}`)

      const result = await page.evaluate(() => {
        const track = document.querySelector<HTMLElement>(
          '[data-scroll-chomper]',
        )
        const main = document.querySelector('main')

        if (!track || !main) {
          return {
            exists: false,
            pointerEvents: '',
            overlapsCriticalContent: true,
          }
        }

        const chomper = track.querySelector<HTMLElement>('div')
        const chomperBox = chomper?.getBoundingClientRect()
        const criticalElements = Array.from(
          main.querySelectorAll<HTMLElement>('h1, h2, p, a, button'),
        ).filter((element) => {
          const style = getComputedStyle(element)
          const box = element.getBoundingClientRect()

          return (
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            box.width > 0 &&
            box.height > 0
          )
        })

        const overlapsCriticalContent =
          chomperBox !== undefined &&
          criticalElements.some((element) => {
            const box = element.getBoundingClientRect()

            return !(
              chomperBox.right <= box.left ||
              chomperBox.left >= box.right ||
              chomperBox.bottom <= box.top ||
              chomperBox.top >= box.bottom
            )
          })

        return {
          exists: true,
          pointerEvents: getComputedStyle(track).pointerEvents,
          overlapsCriticalContent,
        }
      })

      expect(result.exists).toBe(true)
      expect(result.pointerEvents).toBe('none')
      expect(result.overlapsCriticalContent).toBe(false)
    }
  })
})
