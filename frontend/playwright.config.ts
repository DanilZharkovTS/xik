import { defineConfig, devices } from '@playwright/test'

const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL
const baseURL = configuredBaseUrl ?? 'http://127.0.0.1:3100'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    colorScheme: 'dark',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },
  ],
  webServer: configuredBaseUrl
    ? undefined
    : {
        command:
          'npm run build && npm run start -- --hostname 127.0.0.1 --port 3100',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        url: baseURL,
      },
})
