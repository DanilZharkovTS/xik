import { expect, test } from '../support/test'

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
    await expect(toggle).toHaveAttribute('data-theme-preference', 'dark')
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(0, 0, 0)',
    )
    await expect(toggle).toHaveCSS('border-top-width', '0px')

    await toggle.click()

    await expect(root).toHaveAttribute('data-theme', 'light')
    await expect(
      page.getByRole('button', {
        name: 'Switch to system theme',
      }),
    ).toHaveAttribute('data-theme-preference', 'light')
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    )
    await expect(page.locator('body')).toHaveCSS(
      'color',
      'rgb(29, 29, 31)',
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
        name: 'Switch to system theme',
      }),
    ).toHaveAttribute('data-theme-preference', 'light')
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
        name: 'Switch to system theme',
      }),
    ).toBeFocused()
  })

  test('auto theme follows the system color scheme and persists', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')

    const root = page.locator('html')

    // темна → світла → авто
    await page.getByRole('button', { name: 'Switch to light theme' }).click()
    await page.getByRole('button', { name: 'Switch to system theme' }).click()

    const toggle = page.getByRole('button', { name: 'Switch to dark theme' })
    await expect(toggle).toHaveAttribute('data-theme-preference', 'system')
    await expect(root).toHaveAttribute('data-theme-preference', 'system')
    await expect(root).toHaveAttribute('data-theme', 'light')
    await expect
      .poll(() =>
        page.evaluate(
          (storageKey) => window.localStorage.getItem(storageKey),
          THEME_STORAGE_KEY,
        ),
      )
      .toBe('system')

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(root).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(0, 0, 0)',
    )
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#000000',
    )

    await page.emulateMedia({ colorScheme: 'light' })
    await page.reload()
    await expect(root).toHaveAttribute('data-theme', 'light')
    await expect(toggle).toHaveAttribute('data-theme-preference', 'system')

    // авто → темна: системна тема більше не впливає
    await toggle.click()
    await expect(root).toHaveAttribute('data-theme', 'dark')
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(root).toHaveAttribute('data-theme', 'dark')
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
      'rgb(255, 255, 255)',
    )
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#ffffff',
    )
  })
})
