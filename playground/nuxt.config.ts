export default defineNuxtConfig({
  modules: ['@nuxt/ui', '../src/module'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  ui: {
    prefix: 'U'
  },

  compatibilityDate: '2025-02-12',

  compodium: {
    collections: [
      { name: 'Components', path: 'components/', ignore: ['IgnoredComponent.vue'] }
    ]
  }
})
