import { expect, test } from '../support/test'
import type { Page } from '@playwright/test'

const WIDGET_ORIGIN = 'https://agent.xik.app'

async function mockChat(page: Page): Promise<void> {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }))
  await page.route(`${WIDGET_ORIGIN}/public/v1/widget.js`, (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `window.AgentPlatformWidget = {
      mount: async function (key) {
        if (document.querySelector('[data-chat-site="' + key + '"]')) return null;
        const frame = document.createElement('iframe');
        frame.dataset.chatSite = key;
        frame.title = 'XIK chat';
        document.body.append(frame);
        return frame;
      },
      unmount: function (key) {
        document.querySelector('[data-chat-site="' + key + '"]')?.remove();
      }
    };`,
  }))
}

for (const path of ['/', '/es', '/uk', '/services']) {
  test(`public chat appears once on ${path}`, async ({ page }) => {
    await mockChat(page)
    await page.goto(path)
    await expect(page.locator('iframe[data-chat-site="xik-app"]')).toHaveCount(1)
  })
}

for (const path of ['/auth/login', '/es/auth/login', '/account', '/dashboard']) {
  test(`chat does not load on ${path}`, async ({ page }) => {
    let loads = 0
    await mockChat(page)
    page.on('request', (request) => {
      if (request.url() === `${WIDGET_ORIGIN}/public/v1/widget.js`) loads++
    })
    await page.goto(path)
    await expect(page.getByRole('button', { name: /sign in|iniciar|увійти/i })).toBeVisible()
    expect(loads).toBe(0)
    await expect(page.locator('iframe[data-chat-site]')).toHaveCount(0)
  })
}

test('SPA navigation removes chat from account pages and remounts once on return', async ({ page }) => {
  await mockChat(page)
  await page.goto('/')
  const chat = page.locator('iframe[data-chat-site="xik-app"]')
  await expect(chat).toHaveCount(1)
  await page.locator('a[href="/auth/login"]').first().click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  await expect(chat).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL('/')
  await expect(chat).toHaveCount(1)
})

test('late script completion cannot mount chat after navigation to login', async ({ page }) => {
  await mockChat(page)
  let release!: () => void
  const pending = new Promise<void>((resolve) => { release = resolve })
  let requested!: () => void
  const started = new Promise<void>((resolve) => { requested = resolve })
  await page.route(`${WIDGET_ORIGIN}/public/v1/widget.js`, async (route) => {
    requested()
    await pending
    await route.fallback()
  })
  await page.goto('/')
  await started
  await page.locator('a[href="/auth/login"]').first().click()
  await expect(page).toHaveURL(/\/auth\/login$/)
  release()
  await page.waitForFunction(() => Boolean(window.AgentPlatformWidget))
  await expect(page.locator('iframe[data-chat-site]')).toHaveCount(0)
})
