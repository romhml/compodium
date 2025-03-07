export default defineNuxtConfig({
  modules: ['../../../src/module'],

  compodium: {
    exclude: [
      'ExcludedComponent'
    ]
  }
})
