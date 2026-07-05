import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['../../../src/module'],
  alias: {
    '#fixture-types': fileURLToPath(new URL('./app/types/props.ts', import.meta.url))
  },

  compodium: {
    ignore: [
      'ExcludedComponent.vue'
    ]
  }
})
