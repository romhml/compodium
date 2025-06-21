import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    maxConcurrency: 1,
    projects: [
      'packages/*'
    ],
    env: {
      COMPODIUM_TEST: 'true'
    }
  }
})
