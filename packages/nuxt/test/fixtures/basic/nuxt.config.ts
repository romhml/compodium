export default defineNuxtConfig({
  modules: ['../../../src/module'],

  compodium: {
    ignore: [
      'ExcludedComponent.vue'
    ]
  }
})
