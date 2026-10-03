import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

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

  test('completed boot has no detectable Axe violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-system-boot]')).toHaveAttribute(
      'data-boot-state',
      'ready',
    )

    await expectNoViolations(page)
  })

  test('focused principle module has no detectable Axe violations', async ({
    page,
  }) => {
    await page.goto('/')

    const principles = page.locator('[data-system-module="principles"]')
    const firstCard = principles.locator('[tabindex="0"]').first()

    await principles.scrollIntoViewIfNeeded()
    await firstCard.focus()
    await expect(firstCard).toBeFocused()

    await expectNoViolations(page)
  })

  test('active product workflow has no detectable Axe violations', async ({
    page,
  }) => {
    await page.goto('/')

    const workflow = page.locator('[data-product-process]')

    await workflow.evaluate((section) => {
      const top = section.getBoundingClientRect().top + window.scrollY
      const start = top - window.innerHeight * 0.82
      const end = top + section.clientHeight - window.innerHeight * 0.24

      window.scrollTo({
        behavior: 'instant',
        top: start + (end - start) * 0.55,
      })
    })
    await expect(workflow).toHaveAttribute('data-workflow-stage', '2')

    await expectNoViolations(page)
  })

  test('completed system status has no detectable Axe violations', async ({
    page,
  }) => {
    await page.goto('/')

    const status = page.locator('[data-system-module="system-status"]')

    await status.scrollIntoViewIfNeeded()
    await expect(status).toHaveAttribute('data-module-state', 'ready', {
      timeout: 2_000,
    })

    await expectNoViolations(page)
  })

  test('reduced-motion Home has no detectable Axe violations', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    await expect(page.locator('[data-system-boot]')).toHaveAttribute(
      'data-boot-mode',
      'reduced',
    )

    await expectNoViolations(page)
  })
})
