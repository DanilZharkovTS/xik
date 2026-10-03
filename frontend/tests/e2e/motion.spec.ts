import { expect, test } from '@playwright/test'

import { PRODUCTS } from '../support/catalog'

test.describe('motion safety and progressive enhancement', () => {
  test('primary content remains present without JavaScript', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: {
        width: 390,
        height: 844,
      },
    })
    const page = await context.newPage()

    await page.goto('/')
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'AI tools built by a dev. Powered by curiosity.',
      }),
    ).toBeVisible()
    await expect(
      page.getByText(
        'We build focused AI products that remove friction, improve technical workflows, and help capable teams deliver more with less repetitive work.',
      ),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'What We Build',
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'From Problem To Product.',
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'Products' }),
    ).toBeVisible()
    await expect(page.getByText(PRODUCTS[0].description)).toBeVisible()
    await expect(page.getByText('GOLANG', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'System Status',
      }),
    ).toBeVisible()

    const staticHero = page.locator('[data-hero-world]')

    const developers = staticHero.locator(
      '[data-developer-sprite]',
    )

    await expect(developers).toHaveCount(2)
    await expect(developers.nth(0)).toBeVisible()
    await expect(developers.nth(1)).toBeVisible()
    await expect(
      staticHero.locator('[data-ai-dinosaur]'),
    ).toBeVisible()
    await expect(staticHero.locator('svg').first()).toBeVisible()
    await expect(
      staticHero.getByRole('button', {
        name: 'Activate AI dinosaur sequence',
      }),
    ).toBeHidden()

    await page.goto('/products')
    await expect(page.locator('main article')).toHaveCount(
      PRODUCTS.length,
    )

    await context.close()
  })

  test('reduced motion keeps content static and hides ScrollChomper', async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: 'reduce',
    })
    await page.setViewportSize({
      width: 390,
      height: 844,
    })
    await page.goto('/')
    await page.waitForTimeout(100)

    const state = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>(
        '[data-scroll-chomper]',
      )
      const hero = document.querySelector<HTMLElement>(
        '[data-hero-scene]',
      )

      return {
        heroActive: hero?.dataset.active,
        runningAnimations: document
          .getAnimations()
          .filter((animation) => animation.playState === 'running')
          .length,
        trackDisplay: track ? getComputedStyle(track).display : null,
      }
    })

    expect(state.heroActive).toBe('false')
    expect(state.runningAnimations).toBe(0)
    expect(state.trackDisplay).toBe('none')
    await expect(page.locator('[data-hero-world]')).toHaveAttribute(
      'data-gesture-controller',
      'reduced',
    )
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'From Problem To Product.',
      }),
    ).toBeVisible()
    await expect(page.getByText('GOLANG', { exact: true })).toBeVisible()
  })

  test('product card focus has the same visible status response as hover', async ({
    page,
  }) => {
    await page.goto('/products')

    const firstCard = page.locator('main article').first()
    const productLink = firstCard.getByRole('link', {
      name: 'View Product',
    })
    const activeStatus = firstCard.locator(
      '.product-card-status-active',
    )

    await productLink.focus()

    await expect(productLink).toBeFocused()
    await expect(activeStatus).toHaveCSS('opacity', '1')
  })

  test('ScrollChomper tracks progress, direction, and idle mouth state', async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    })
    await page.goto(`/products/${PRODUCTS[0].slug}`)

    const track = page.locator('[data-scroll-chomper]')

    await expect(track).toHaveAttribute('aria-hidden', 'true')
    await expect(track).toHaveAttribute('data-scrollable', 'true')
    await expect(track).toHaveAttribute(
      'data-controller-ready',
      'true',
    )
    await page.bringToFront()
    await expect
      .poll(() => page.evaluate(() => document.visibilityState))
      .toBe('visible')

    await page.evaluate(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'instant',
      })
    })

    await expect(track).toHaveAttribute('data-scrolling', 'true')
    await expect
      .poll(() =>
        track.evaluate((element) => ({
          direction: element.getAttribute('data-direction'),
          progress: element.style.getPropertyValue(
            '--scroll-progress',
          ),
          runningMouthAnimations: element
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation.playState === 'running' &&
                animation instanceof CSSAnimation &&
                animation.animationName.includes('frame'),
            ).length,
          scrolling: element.getAttribute('data-scrolling'),
        })),
      )
      .toEqual({
        direction: 'down',
        progress: '100.000%',
        runningMouthAnimations: 3,
        scrolling: 'true',
      })

    await page.evaluate(() => {
      window.scrollBy({
        top: -100,
        behavior: 'instant',
      })
    })
    await page.waitForTimeout(30)
    await expect(track).toHaveAttribute('data-direction', 'up')

    await page.waitForTimeout(500)
    await expect(track).toHaveAttribute('data-scrolling', 'false')
    await expect
      .poll(() =>
        track.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === 'running')
              .length,
        ),
      )
      .toBe(0)
  })

  test('offscreen hero pauses all decorative animation', async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    })
    await page.goto('/')

    const hero = page.locator('[data-hero-scene]')

    await expect(hero).toHaveAttribute('data-active', 'true')
    await page.evaluate(() => {
      const spacer = document.createElement('div')

      spacer.style.height = '1800px'
      document.body.append(spacer)
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'instant',
      })
    })

    await expect(hero).toHaveAttribute('data-active', 'false')
    await expect(hero).toHaveAttribute(
      'data-gesture-controller',
      'paused',
    )
    await expect(
      hero.locator('[data-developer-sprite="primary"]'),
    ).toHaveAttribute('data-developer-gesture', 'base')
    await expect(
      hero.locator('[data-developer-sprite="secondary"]'),
    ).toHaveAttribute('data-developer-gesture', 'base')
    await expect
      .poll(() =>
        hero.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === 'running')
              .length,
        ),
      )
      .toBe(0)
  })

  test('hidden document pauses and restores hero activity', async ({
    page,
  }) => {
    await page.goto('/')

    const hero = page.locator('[data-hero-scene]')

    await expect(hero).toHaveAttribute('data-active', 'true')
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await expect(hero).toHaveAttribute('data-active', 'false')
    await expect(hero).toHaveAttribute(
      'data-gesture-controller',
      'paused',
    )
    await expect
      .poll(() =>
        hero.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === 'running')
              .length,
        ),
      )
      .toBe(0)

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(hero).toHaveAttribute('data-active', 'true')
  })

  test('short pages show an idle scroll indicator', async ({ page }) => {
    await page.setViewportSize({
      width: 1440,
      height: 900,
    })
    const response = await page.goto('/not-a-real-route')
    const track = page.locator('[data-scroll-chomper]')

    expect(response?.status()).toBe(404)
    await expect(track).toHaveAttribute('data-scrollable', 'false')
    await expect(track).toHaveCSS('opacity', '1')
    await expect(track.locator('span').first()).toHaveCSS(
      'display',
      'none',
    )
    await expect(track.getByText('IDLE')).toBeVisible()
  })
})
