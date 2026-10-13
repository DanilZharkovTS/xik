import { expect, test } from '../support/test'
import { PRODUCTS } from '../support/catalog'

test.describe('motion safety and progressive enhancement', () => {
  test('primary content and catalog remain present without JavaScript', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Building things that should exist.' })).toBeVisible()
    await expect(page.getByText('Independent products, infrastructure and autonomous AI systems engineered around real problems.')).toBeVisible()
    for (const name of ['Built to run.', 'AI, with a job.', 'The systems underneath.', 'One ecosystem. Multiple systems.']) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
    }
    await expect(page.locator('iframe')).toHaveCount(0)
    await page.goto('/products')
    await expect(page.locator('main h2')).toHaveCount(PRODUCTS.length)
    await context.close()
  })

  test('reduced motion keeps all content static', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('[data-theme-toggle]')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)).toBe(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('#products h2')).toBeVisible()
    await expect(page.locator('#about h2')).toBeVisible()
  })

  test('catalog card focus provides a visible keyboard indicator', async ({ page }) => {
    await page.goto('/products')
    const link = page.locator('main li a').first()
    await link.focus()
    await expect(link).toBeFocused()
    await expect(link).toHaveCSS('outline-style', 'solid')
    await expect(link).toHaveCSS('outline-width', '2px')
  })

  test('scroll navigation reaches content without decorative overlays', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    for (const id of ['products', 'ai', 'services', 'about']) {
      await page.locator(`#${id} h2`).scrollIntoViewIfNeeded()
      await expect(page.locator(`#${id} h2`)).toBeInViewport()
    }
    await expect(page.locator('[data-scroll-chomper]')).toHaveCount(0)
  })

  test('offscreen public hero does not keep decorative animation running', async ({ page }) => {
    await page.goto('/')
    await page.locator('#about').scrollIntoViewIfNeeded()
    await expect.poll(() => page.evaluate(() => document.querySelector('#top')?.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0)
  })

  test('visibility changes preserve static hero content', async ({ page }) => {
    await page.goto('/')
    for (const value of ['hidden', 'visible']) {
      await page.evaluate((visibility) => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: visibility })
        document.dispatchEvent(new Event('visibilitychange'))
      }, value)
      await expect(page.locator('#top h1')).toBeVisible()
      await expect.poll(() => page.locator('#top').evaluate(el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length)).toBe(0)
    }
  })

  test('short 404 pages have usable navigation and no decorative overlay', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    expect((await page.goto('/not-a-real-route'))?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.locator('[data-scroll-chomper]')).toHaveCount(0)
    await page.getByRole('link', { name: 'Go home' }).focus()
    await expect(page.getByRole('link', { name: 'Go home' })).toBeFocused()
  })
})
