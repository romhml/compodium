export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@compodium/nuxt',
    '@nuxt/test-utils/module',
    'reka-ui/nuxt'
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  sourcemap: {
    client: true,
    server: true
  },
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
    },
    testing: {
      enabled: true
    }
  }
})
