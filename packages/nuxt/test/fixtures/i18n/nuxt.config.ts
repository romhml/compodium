export default defineNuxtConfig({
  modules: ['../../../src/module', '@nuxtjs/i18n'],

  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix',
    locales: [{ code: 'en', language: 'en-GB', name: 'English' }]
  }
})
