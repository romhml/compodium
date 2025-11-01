export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@compodium/nuxt',
    '@nuxt/test-utils/module'
  ],

  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  nitro: {
    devProxy: {
      '/__compodium__/devtools': {
        target: process.env.COMPODIUM_DEVTOOLS_URL + `/__compodium__/devtools/`,
        changeOrigin: true
      }
    }
  },

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
