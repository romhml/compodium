import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['../../../src/module'],
  alias: {
    'vue-component-meta': fileURLToPath(new URL('./vue-component-meta.ts', import.meta.url))
  }
})
