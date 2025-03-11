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
      rootDir: import.meta.resolve('./src'),
      componentDirs: [
        {
          path: './src/components',
          global: true,
          pathPrefix: false
        },
        {
          path: './node_modules/@nuxt/ui/dist/runtime/',
          global: true,
          pathPrefix: false,
          prefix: 'U'
        }
      ],
      dir: 'compodium'
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
