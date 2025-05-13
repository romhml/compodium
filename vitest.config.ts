import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    workspace: [
      'packages/*'
    ],
    env: {
      COMPODIUM_TEST: 'true'
    }
  }
})
