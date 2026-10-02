import type { ConsoleMessage, Page } from '@playwright/test'

export function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error: Error) => {
    errors.push(error.message)
  })

  return errors
}

export async function getHorizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
}
