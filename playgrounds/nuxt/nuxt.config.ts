export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@compodium/nuxt',
    '@nuxt/test-utils/module'
  ],

  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  compodium: {
    extras: {
      colors: {
        primary: 'blue',
        neutral: 'zinc'
      }
    },
    testing: {
      enabled: true
    }
  }
})
