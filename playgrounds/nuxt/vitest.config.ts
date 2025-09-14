import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    silent: 'passed-only',
    include: [
      './playgrounds/nuxt/test/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ]
  }
})
