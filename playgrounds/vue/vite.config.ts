import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { compodium } from '@compodium/vue'
import ui from '@nuxt/ui/vite'

import chokidar from 'chokidar'

// https://vite.dev/config/
export default defineConfig({
  server: {
    fs: {
      allow: ['../../']
    }
  },

  plugins: [
    vue(),
    vueDevTools(),
    ui({ ui: { colors: { neutral: 'zinc' } } }),
    compodium({
      includeLibraryCollections: true,
      testing: {
        enabled: true
      }
    }),

    {
      name: 'compodium:dev',
      configureServer(server) {
        const watchPath = resolve(server.config.root, '../../packages/')

        const watcher = chokidar.watch(watchPath, {
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/runtime/**',
            '../../packages/devtools/'
          ],
          persistent: true,
          ignoreInitial: true
        })

        watcher.on('change', (filePath) => {
          console.log(`[compodium dev] ${filePath} changed, restarting server...`)
          watcher.close()
          server.restart()
        })
      }
    },

    // Ignore components.d.ts updates to avoid reloading the page
    // when importing a new component in compodium.
    {
      name: 'ignore-components-dts-hmr',
      handleHotUpdate(ctx) {
        if (ctx.file.endsWith('components.d.ts')) return []
      }
    }
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
