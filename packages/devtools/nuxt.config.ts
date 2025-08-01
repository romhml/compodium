import { resolve } from 'pathe'

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  ssr: false,

  components: {
    dirs: [{ path: 'components', pathPrefix: false }]
  },

  devtools: { enabled: false },

  app: {
    baseURL: '/__compodium__/devtools',
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },

  css: ['~/assets/css/main.css'],

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../core/dist/client/devtools')
    }
  }
})
