import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/*'
    ],
    env: {
      COMPODIUM_TEST: 'true'
    }
  }
})
