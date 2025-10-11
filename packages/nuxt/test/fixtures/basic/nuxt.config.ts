export default defineNuxtConfig({
  modules: ['../../../src/module'],
  test: false,
  compodium: {
    ignore: [
      'ExcludedComponent.vue'
    ]
  }
})
