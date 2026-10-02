import { expect, test } from '@playwright/test'

import {
  MODERN_PRINCIPLES,
  MODERN_SERVICES,
} from '../../src/features/home/data/modern-home-data'
import { MODERN_AI_CARDS, MODERN_PRODUCTS } from '../support/catalog'

test.describe('modern homepage', () => {
  test('renders the modern homepage content and sections', async ({ page }) => {
    await page.goto('/')

    // Hero Section
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Building things/i,
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('link', { name: 'Explore products' }),
    ).toBeVisible()

    await expect(page.getByRole('link', { name: 'Explore AI' })).toBeVisible()

    // Products Section
    await expect(
      page.getByRole('heading', { level: 2, name: 'Built to run.' }),
    ).toBeVisible()

    for (const product of MODERN_PRODUCTS) {
      await expect(
        page.getByRole('heading', { level: 3, name: product.title }),
      ).toBeVisible()
    }

    // AI Products & Agents Section
    await expect(
      page.getByRole('heading', { level: 2, name: 'AI, with a job.' }),
    ).toBeVisible()

    for (const card of MODERN_AI_CARDS) {
      await expect(
        page.getByRole('heading', { level: 3, name: card.title }),
      ).toBeVisible()
    }

    // Services Section
    await expect(
      page.getByRole('heading', { level: 2, name: 'The systems underneath.' }),
    ).toBeVisible()

    for (const service of MODERN_SERVICES) {
      await expect(
        page.getByRole('heading', { level: 3, name: service.title }),
      ).toBeVisible()
    }

    // About & Principles Section
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: /One ecosystem/i,
      }),
    ).toBeVisible()

    for (const principle of MODERN_PRINCIPLES) {
      await expect(page.getByText(principle.title)).toBeVisible()
    }
  })
})
