export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@compodium/nuxt'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  typescript: {
    tsConfig: {
      compilerOptions: {
        skipLibCheck: true
      }
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
