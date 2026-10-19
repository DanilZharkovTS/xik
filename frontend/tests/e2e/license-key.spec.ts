import { expect, test } from '../support/test'

const testUser = {
  id: 'user-sub-1',
  email: 'subscriber@example.test',
  name: 'Subscriber',
  role: 'user',
  locale: 'en',
  sessionId: 'session-sub-1',
}

const testProduct = {
  id: 'prod-sub-1',
  slug: 'test-product',
  name: 'Test Pro Subscription',
  description: 'Test product description',
  shortDescription: 'Short description',
  price: 2900,
  currency: 'USD',
  billingPeriod: 'monthly' as const,
  features: ['Feature 1'],
  isPopular: false,
  sortOrder: 1,
  metadata: {},
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const testLibraryItem = {
  id: 'lib-item-123',
  subscriptionId: 'sub_stripe_123',
  status: 'active' as const,
  accessExpiresAt: '2027-01-01T00:00:00Z',
  canceledAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  product: testProduct,
}

test('profile subscription card displays Get license key button and opens masked modal', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      json: { user: testUser, accessToken: 'valid-test-token' },
    })
  })

  await page.route('**/api/account/library**', async (route) => {
    await route.fulfill({
      json: { items: [testLibraryItem] },
    })
  })

  await page.route('**/api/account/saved**', async (route) => {
    await route.fulfill({
      json: { products: [] },
    })
  })

  let requestCount = 0
  await page.route('**/api/library/lib-item-123/license-key', async (route) => {
    requestCount++
    // Simulate slight delay so loading state can be observed if needed
    await new Promise((resolve) => setTimeout(resolve, 100))
    await route.fulfill({
      json: {
        libraryItem: {
          ...testLibraryItem,
          licenseKey: 'XIK-SECRET-KEY-9999',
        },
      },
    })
  })

  await page.goto('/account')

  // Verify subscription card rendered
  await expect(page.getByText('Test Pro Subscription')).toBeVisible()

  // Find Get license key button
  const getKeyBtn = page.getByRole('button', { name: /get license key/i })
  await expect(getKeyBtn).toBeVisible()

  // Click button to fetch license key
  await getKeyBtn.click()

  // Verify modal is open
  const modal = page.getByRole('alertdialog')
  await expect(modal).toBeVisible()
  await expect(modal.getByRole('heading', { name: /license key/i })).toBeVisible()

  // Verify license key input is masked (type="password")
  const input = modal.locator('input[type="password"]')
  await expect(input).toBeVisible()
  await expect(input).toHaveValue('XIK-SECRET-KEY-9999')

  // Verify both copy buttons exist in modal and click the confirm button
  const copyBtn = modal.getByRole('button', { name: /^copy$/i }).last()
  await expect(copyBtn).toBeVisible()
  await copyBtn.click()

  // Verify copied status on button
  await expect(modal.getByRole('button', { name: /copied!/i })).toBeVisible()

  // Verify clipboard has plain license key
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboardText).toBe('XIK-SECRET-KEY-9999')

  // Verify input is STILL masked with password type (not visible as plain text in input)
  await expect(input).toHaveAttribute('type', 'password')

  // Close the modal via footer button
  const closeBtn = modal.getByRole('button', { name: /close/i }).last()
  await closeBtn.click()

  // Modal should be closed
  await expect(modal).toBeHidden()
  expect(requestCount).toBe(1)

  // Verify that clicking "Get license key" again reuses the key from state and DOES NOT send a new network request
  await getKeyBtn.click()
  await expect(modal).toBeVisible()
  await expect(modal.locator('input[type="password"]')).toHaveValue('XIK-SECRET-KEY-9999')
  // Still 1 request (no additional network call made)
  expect(requestCount).toBe(1)

  await modal.getByRole('button', { name: /close/i }).last().click()
  await expect(modal).toBeHidden()
})
