import { expect, test } from '../support/test'

import { PRODUCTS } from '../support/catalog'
import { collectRuntimeErrors } from '../support/runtime'

const PUBLIC_PAGES = [
  {
    path: '/',
    title: 'XIK — AI Products, Agents & Engineering Services',
    heading: 'Building things that should exist.',
  },
  {
    path: '/products',
    title: 'AI Software Products | XIK',
    heading: 'AI Software Products',
  },
  {
    path: '/about',
    title: 'XIK — AI Products, Agents & Engineering Services',
    heading: 'Building things that should exist.',
  },
] as const

test.describe('public routes and navigation', () => {
  for (const publicPage of PUBLIC_PAGES) {
    test(`${publicPage.path} renders its primary content`, async ({
      page,
    }) => {
      const runtimeErrors = collectRuntimeErrors(page)
      const response = await page.goto(publicPage.path)

      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(publicPage.title)
      await expect(page.locator('main#main-content')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(
        1,
      )
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: publicPage.heading,
        }),
      ).toBeVisible()
      expect(runtimeErrors).toEqual([])
    })
  }

  for (const product of PRODUCTS) {
    test(`${product.slug} is server-rendered and crawlable`, async ({
      page,
    }) => {
      const runtimeErrors = collectRuntimeErrors(page)
      const response = await page.goto(`/products/${product.slug}`)

      expect(response?.status()).toBe(200)
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: product.name,
        }),
      ).toBeVisible()
      await expect(page.getByText(product.description)).toBeVisible()
      await expect(page.getByRole('heading', { name: product.features[0], exact: true })).toBeVisible()
      expect(runtimeErrors).toEqual([])
    })
  }

  test('invalid routes return the custom 404 response', async ({
    page,
  }) => {
    const invalidProduct = await page.goto(
      '/products/not-a-real-product',
    )

    expect(invalidProduct?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { level: 1, name: '404' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go home' })).toHaveAttribute(
      'href',
      '/',
    )

    const unknownRoute = await page.goto('/not-a-real-route')

    expect(unknownRoute?.status()).toBe(404)
    await expect(
      page.getByRole('heading', { level: 1, name: '404' }),
    ).toBeVisible()
  })

  test('desktop navigation exposes and updates the active route', async ({
    page,
  }) => {
    await page.goto('/')

    const navigation = page.getByRole('navigation', {
      name: 'Primary navigation',
    })
    const productsLink = navigation.getByRole('link', {
      name: 'Products',
    })

    await expect(productsLink).toHaveAttribute('href', '#products')
    await productsLink.click()
    await expect(page).toHaveURL('/#products')
    await expect(page.locator('#products')).toBeVisible()
  })

  test('skip link moves keyboard focus to main content', async ({
    page,
  }) => {
    await page.goto('/')
    const skipLink = page.getByRole('link', {
      name: 'Skip to content',
    })

    await page.keyboard.press('Tab')
    await expect(skipLink).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/#main-content$/)
    await expect(page.locator('main#main-content')).toBeFocused()
  })

  test('product cards contain standard crawlable links', async ({
    page,
  }) => {
    await page.goto('/products')

    const cards = page.locator('main li').filter({ has: page.getByRole('heading', { level: 2 }) })

    await expect(cards).toHaveCount(PRODUCTS.length)

    for (const [index, product] of PRODUCTS.entries()) {
      const card = cards.nth(index)

      await expect(
        card.getByRole('heading', {
          level: 2,
          name: product.name,
        }),
      ).toBeVisible()
      await expect(card.getByRole('link')).toHaveAttribute(
        'href',
        `/products/${product.slug}`,
      )
    }
  })
})
