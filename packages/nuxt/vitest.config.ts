import { defineVitestConfig } from '@nuxt/test-utils/config'
import { defaultExclude } from 'vitest/config'

export default defineVitestConfig({
  test: {
    globals: true,
    silent: true,
    exclude: [...defaultExclude, './test/vue/**.spec.ts'],
    environment: 'nuxt',
    env: {
      COMPODIUM_DEVTOOLS_URL: 'http://localhost:4242'
    }
  }
})
