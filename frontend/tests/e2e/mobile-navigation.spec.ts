import { expect, test } from '@playwright/test'

test.use({
  hasTouch: true,
  isMobile: true,
  viewport: {
    width: 390,
    height: 844,
  },
})

test.describe('mobile navigation', () => {
  test('supports focus containment, Escape, and focus restoration', async ({
    page,
  }) => {
    await page.goto('/')

    const trigger = page.getByRole('button', {
      name: 'Open navigation menu',
    })
    const dialog = page.locator('dialog#mobile-navigation')
    const closeButton = page.getByRole('button', {
      name: 'Close navigation menu',
    })

    await expect(trigger).toHaveAttribute(
      'aria-controls',
      'mobile-navigation',
    )
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(dialog).toBeHidden()

    await trigger.click()

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(dialog).toBeVisible()
    await expect(closeButton).toBeFocused()
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe('hidden')

    await page.keyboard.press('Shift+Tab')
    await expect(
      dialog.getByRole('link', { name: 'Get Started' }),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(closeButton).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe('')

    await page.keyboard.press('Tab')
    await expect
      .poll(() =>
        dialog.evaluate(
          (element) => !element.contains(document.activeElement),
        ),
      )
      .toBe(true)
  })

  test('route navigation closes the menu and restores body scrolling', async ({
    page,
  }) => {
    await page.goto('/')

    const trigger = page.getByRole('button', {
      name: 'Open navigation menu',
    })
    const dialog = page.locator('dialog#mobile-navigation')

    await trigger.click()
    await dialog.getByRole('link', { name: 'About Us' }).click()

    await expect(page).toHaveURL('/about')
    await expect(dialog).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe('')
  })
})
