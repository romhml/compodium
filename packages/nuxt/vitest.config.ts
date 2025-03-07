import { defineVitestConfig } from '@nuxt/test-utils/config'
import { defaultExclude } from 'vitest/config'

export default defineVitestConfig({
  test: {
    testTimeout: 10000,
    globals: true,
    silent: true,
    exclude: [...defaultExclude, './test/vue/**.spec.ts'],
    environment: 'nuxt',
    env: {
      COMPODIUM_TEST: 'true'
    }
  }
})
