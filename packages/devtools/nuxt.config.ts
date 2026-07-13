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
  experimental: {
    viteEnvironmentApi: true
  },

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../core/dist/client/devtools')
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueuse/core',
        '@vueuse/integrations/useFuse',
        'deep-eql',
        'json-editor-vue',
        'knitwork',
        'shiki',
        'shiki/core',
        'shiki/langs/markdown.mjs',
        'shiki/langs/vue.mjs',
        'shiki/themes/material-theme-lighter.mjs',
        'shiki/themes/material-theme-palenight.mjs',
        'shiki/wasm'
      ]
    }
  }
})
