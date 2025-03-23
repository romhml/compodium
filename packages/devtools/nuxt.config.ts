import { resolve } from 'pathe'

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  ssr: false,
  components: {
    dirs: [
      { path: 'components', pathPrefix: false }
    ]
  },
  devtools: { enabled: false },

  app: {
    baseURL: '/__compodium__/devtools',
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
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
      publicDir: resolve(__dirname, '../core/dist/client/devtools')
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
