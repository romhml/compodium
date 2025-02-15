import { resolve } from 'pathe'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/test-utils/module'],
  ssr: false,
  components: {
    dirs: [
      { path: 'components', pathPrefix: false }
    ]
  },
  devtools: { enabled: false },

  app: {
    baseURL: '/__compodium__/devtools'
  },
  css: ['~/assets/css/main.css'],
  spaLoadingTemplate: true,
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-04-03',

  nitro: {
    hooks: {
      'prerender:routes': function (routes) {
        routes.clear()
      }
    },
    output: {
      publicDir: resolve(__dirname, '../dist/client/devtools')
    }
  },

  vite: {
    server: {
      hmr: {
        clientPort: process.env.PORT ? +process.env.PORT : undefined
      }
    }
  }
})
