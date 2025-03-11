export default defineNuxtConfig({
  modules: ['@nuxt/ui', 'compodium'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-02-12',

  typescript: {
    tsConfig: {
      compilerOptions: {
        skipLibCheck: true
      }
    }
  }
})
