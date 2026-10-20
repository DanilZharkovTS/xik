import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.route('**/api/auth/refresh', (route) => route.fulfill({ json: { user: null, accessToken: null } }))
    await page.route('https://agent.xik.app/public/v1/widget.js', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }))
    await runTest(page)
  },
})
export { expect }
