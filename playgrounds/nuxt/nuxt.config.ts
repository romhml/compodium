export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@compodium/nuxt'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-02-12',

  vite: {
    resolve: {
      conditions: ['@compodium/dev', 'development']
    }
  },

  compodium: {
    extras: {
      colors: {
        primary: 'blue',
        neutral: 'zinc'
      }
    }
  }
})
