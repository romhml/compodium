export default defineNuxtConfig({
  modules: ['@nuxt/ui', '../src/module'],
  components: [
    { path: 'components/' },
    { path: 'my-ui/', prefix: 'D' }
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-02-12'
})
