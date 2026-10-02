import { expect, test } from '@playwright/test'

import { collectRuntimeErrors } from '../support/runtime'

test.describe('homepage animation lifecycle', () => {
  test('leaves no decorative CSS animation running at idle page end', async ({
    page,
  }) => {
    const runtimeErrors = collectRuntimeErrors(page)

    await page.goto('/')
    await expect(page.locator('[data-system-boot]')).toHaveAttribute(
      'data-boot-state',
      'ready',
    )

    await page.evaluate(() => {
      window.scrollTo({
        behavior: 'instant',
        top: document.documentElement.scrollHeight,
      })
    })
    await expect(page.locator('[data-scroll-chomper]')).toHaveAttribute(
      'data-complete',
      'true',
    )
    await page.waitForTimeout(3_200)

    const runningAnimations = await page.evaluate(() => {
      return document
        .getAnimations()
        .filter(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.playState === 'running' &&
            !animation.animationName.includes('xik-logo-cursor'),
        )
        .map((animation) => (animation as CSSAnimation).animationName)
    })

    expect(runningAnimations).toEqual([])
    expect(runtimeErrors).toEqual([])
  })

  test('creates no long task during post-boot scroll and theme interaction', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('[data-system-boot]')).toHaveAttribute(
      'data-boot-state',
      'ready',
    )

    const supportsLongTasks = await page.evaluate(() => {
      const supported = PerformanceObserver.supportedEntryTypes.includes(
        'longtask',
      )

      if (!supported) {
        return false
      }

      const durations: number[] = []
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => durations.push(entry.duration))
      })

      observer.observe({ type: 'longtask' })
      Object.assign(window, {
        __xikLongTaskDurations: durations,
        __xikLongTaskObserver: observer,
      })

      return true
    })

    expect(supportsLongTasks).toBe(true)

    const exerciseInteractions = async () => {
      await page.evaluate(async () => {
        const scrollLength =
          document.documentElement.scrollHeight - window.innerHeight

        for (let index = 0; index <= 12; index += 1) {
          window.scrollTo({
            behavior: 'instant',
            top: scrollLength * (index / 12),
          })
          await new Promise(requestAnimationFrame)
        }
      })
      await page.locator('[data-theme-toggle]').click()
      await page.waitForTimeout(500)
    }

    const readLongTasks = async ({ disconnect = false } = {}) =>
      page.evaluate((shouldDisconnect) => {
        const diagnostics = window as typeof window & {
          __xikLongTaskDurations?: number[]
          __xikLongTaskObserver?: PerformanceObserver
        }
        const durations = [...(diagnostics.__xikLongTaskDurations ?? [])]

        if (diagnostics.__xikLongTaskDurations) {
          diagnostics.__xikLongTaskDurations.length = 0
        }
        if (shouldDisconnect) {
          diagnostics.__xikLongTaskObserver?.disconnect()
        }

        return durations
      }, disconnect)

    await exerciseInteractions()
    const initialLongTasks = await readLongTasks()

    // A fully parallel browser run can occasionally delay one renderer task.
    // Repeat the warmed interaction to distinguish that contention from a
    // reproducible task caused by the homepage animation system.
    if (initialLongTasks.length > 0) {
      await page.waitForTimeout(500)
      await exerciseInteractions()
    }

    const repeatedLongTasks = await readLongTasks({ disconnect: true })

    expect(repeatedLongTasks).toEqual([])
  })
})
