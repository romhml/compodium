import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    silent: true,
    setupFiles: [
      '../vue/test/setup.ts'
    ],
    env: {
      COMPODIUM_DEVTOOLS_URL: 'http://localhost:4242'
    },
    include: [
      './packages/nuxt/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ]
  }
})
