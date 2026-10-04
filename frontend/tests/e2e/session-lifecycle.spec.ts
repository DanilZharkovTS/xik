import { expect, test } from '@playwright/test'

const user = { id: 'buyer-test', email: 'buyer@example.test', name: 'Buyer', role: 'user', locale: 'en', sessionId: 'session-test' }

test('parallel expired requests share one refresh and retry with the new token', async ({ page }) => {
  let refreshes = 0
  const accepted: string[] = []
  await page.route('**/api/auth/refresh', async (route) => {
    refreshes++
    await route.fulfill({ json: { user, accessToken: refreshes === 1 ? 'expired-token' : 'renewed-token' } })
  })
  await page.route('**/api/account/**', async (route) => {
    const token = route.request().headers().authorization
    if (token !== 'Bearer renewed-token') {
      await route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED' } })
      return
    }
    accepted.push(new URL(route.request().url()).pathname)
    await route.fulfill({ json: route.request().url().includes('/library') ? { items: [] } : { products: [] } })
  })
  await page.goto('/account')
  await expect(page.getByText('You have no subscriptions yet.')).toBeVisible()
  expect(refreshes).toBe(2)
  expect(accepted).toContain('/api/account/library')
  expect(accepted).toContain('/api/account/saved')
})

test('a failed initial refresh leaves checking and permits signing in again', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.abort('failed'))
  await page.goto('/account')
  await expect(page).toHaveURL(/\/auth\/login$/)
  await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled()
})
