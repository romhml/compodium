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
    ui({ ui: { colors: { neutral: 'zinc' } } }),
    compodium({
      testing: { enabled: true }
    }),
    // Ignore components.d.ts updates to avoid reloading the page
    // when importing a new component in compodium.
    {
      name: 'ignore-components-dts-hmr',
      handleHotUpdate(ctx) {
        if (ctx.file.endsWith('components.d.ts')) return []
      }
    }
  ],

  test: {
    environment: 'happy-dom',
    silent: 'passed-only'
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
