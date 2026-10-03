import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/env.ts'],
    // Тести ділять одну БД, тому файли йдуть послідовно.
    fileParallelism: false,
    testTimeout: 20000,
  },
})
