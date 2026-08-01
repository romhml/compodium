export default defineNuxtConfig({
  modules: ['../../../src/module', '@nuxtjs/i18n'],

  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix',
    // Runs the localization middleware during SSR too, so the tests can observe
    // the redirect behavior the browser-side router applies on every navigation.
    experimental: { nitroContextDetection: false },
    locales: [
      { code: 'en', language: 'en-GB', name: 'English' },
      { code: 'it', language: 'it-IT', name: 'Italiano' }
    ]
  }
})
