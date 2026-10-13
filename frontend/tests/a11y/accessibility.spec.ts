import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '../support/test'

import { PRODUCTS } from '../support/catalog'
import { THEME_STORAGE_KEY } from '../../src/features/theme/theme-config'

const ACCESSIBILITY_ROUTES = [
  '/',
  '/products',
  '/about',
  ...PRODUCTS.map((product) => `/products/${product.slug}`),
  '/not-a-real-route',
] as const

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
): string {
  return violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes.length} node(s))`,
    )
    .join('\n')
}

async function expectNoViolations(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a instanceof CSSTransition && a.playState === 'running').length)).toBe(0)
  const results = await new AxeBuilder({ page }).analyze()

  expect(
    results.violations,
    formatViolations(results.violations),
  ).toEqual([])
}

test.describe('automated accessibility checks', () => {
  for (const route of ACCESSIBILITY_ROUTES) {
    test(`${route} has no detectable Axe violations`, async ({ page }) => {
      const response = await page.goto(route)

      expect(response?.status()).toBe(
        route === '/not-a-real-route' ? 404 : 200,
      )

      await expectNoViolations(page)
    })
  }

  test('open mobile navigation has no detectable Axe violations', async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    })
    await page.goto('/')
    await page
      .getByRole('button', { name: 'Open navigation menu' })
      .click()
    await expect(page.locator('dialog#mobile-navigation')).toBeVisible()

    await expectNoViolations(page)
  })

  test('light theme has no detectable Axe violations', async ({ page }) => {
    await page.addInitScript(
      ({ storageKey }) => {
        window.localStorage.setItem(storageKey, 'light')
      },
      {
        storageKey: THEME_STORAGE_KEY,
      },
    )
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      'light',
    )

    await expectNoViolations(page)
  })

  test('hydrated homepage has no detectable Axe violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-theme-toggle]')).toBeVisible()

    await expectNoViolations(page)
  })

  test('focused product card has no detectable Axe violations', async ({
    page,
  }) => {
    await page.goto('/')

    const principles = page.locator('#products')
    const firstCard = principles.getByRole('link').first()

    await principles.scrollIntoViewIfNeeded()
    await firstCard.focus()
    await expect(firstCard).toBeFocused()

    await expectNoViolations(page)
  })

  test('hovered product card has no detectable Axe violations', async ({
    page,
  }) => {
    await page.goto('/')

    const workflow = page.locator('#products a').first()
    await workflow.hover()
    await expect(workflow).toBeVisible()

    await expectNoViolations(page)
  })

  test('services section has no detectable Axe violations', async ({
    page,
  }) => {
    await page.goto('/')

    const status = page.locator('#services')

    await status.scrollIntoViewIfNeeded()
    await expect(status.getByRole('heading', { level: 2 })).toBeVisible()

    await expectNoViolations(page)
  })

  test('reduced-motion Home has no detectable Axe violations', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0)

    await expectNoViolations(page)
  })
})
