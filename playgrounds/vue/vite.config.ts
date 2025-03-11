import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { compodium } from '@compodium/vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),

    compodium({
      rootDir: './src',
      componentDirs: [{
        path: './src/components',
        global: true,
        pathPrefix: false
      }],
      dir: 'compodium'
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
