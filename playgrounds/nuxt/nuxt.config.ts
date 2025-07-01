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
    includeLibraryCollections: false,
    extras: {
      colors: {
        primary: 'blue',
        neutral: 'zinc'
      }
    }
  }
})
