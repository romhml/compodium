import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true,
    silent: true,
    env: {
      COMPODIUM_DEVTOOLS_URL: 'http://localhost:4242'
    }
  }
})
