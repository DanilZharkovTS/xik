import { expect, test } from '@playwright/test'

import { THEME_STORAGE_KEY } from '../../src/features/theme/theme-config'

test.describe('manual monochrome theme', () => {
  test('header toggle inverts colors and persists the selection', async ({
    page,
  }) => {
    await page.goto('/')

    const root = page.locator('html')
    const toggle = page.getByRole('button', {
      name: 'Switch to light theme',
    })

    await expect(root).toHaveAttribute('data-theme', 'dark')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(5, 5, 5)',
    )
    await expect(toggle).toHaveCSS('border-top-width', '4px')

    await toggle.click()

    await expect(root).toHaveAttribute('data-theme', 'light')
    await expect(
      page.getByRole('button', {
        name: 'Switch to dark theme',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(250, 250, 250)',
    )
    await expect(page.locator('body')).toHaveCSS(
      'color',
      'rgb(5, 5, 5)',
    )
    await expect
      .poll(() =>
        page.evaluate(
          (storageKey) => window.localStorage.getItem(storageKey),
          THEME_STORAGE_KEY,
        ),
      )
      .toBe('light')

    await page.reload()

    await expect(root).toHaveAttribute('data-theme', 'light')
    await expect(
      page.getByRole('button', {
        name: 'Switch to dark theme',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('theme toggle works from the keyboard', async ({ page }) => {
    await page.goto('/')

    const toggle = page.getByRole('button', {
      name: 'Switch to light theme',
    })

    await toggle.focus()
    await expect(toggle).toBeFocused()
    await page.keyboard.press('Space')

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      'light',
    )
    await expect(
      page.getByRole('button', {
        name: 'Switch to dark theme',
      }),
    ).toBeFocused()
  })

  test('saved light theme is applied before the page becomes interactive', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ storageKey }) => {
        window.localStorage.setItem(storageKey, 'light')
      },
      {
        storageKey: THEME_STORAGE_KEY,
      },
    )

    await page.goto('/products')

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      'light',
    )
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(250, 250, 250)',
    )
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#fafafa',
    )
  })
})
