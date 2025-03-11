import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { compodium } from '@compodium/vue'
import ui from '@nuxt/ui/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    ui(),
    compodium({
      componentDirs: [
        { path: './src/components', pathPrefix: false },
        {
          path: './node_modules/@nuxt/ui/dist/runtime/',
          pathPrefix: false,
          prefix: 'U',
          ignore: ['App.vue', 'Toast.vue', '*Provider.vue', '*Base.vue', '*Content.vue']
        }
      ]
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
