import type { VitePlugin } from 'unplugin'
import sirv from 'sirv'
import type { PluginConfig } from '../types'
import { resolve } from 'pathe'
import { existsSync, readFileSync } from 'node:fs'

export function devtoolsPlugin(config: PluginConfig): VitePlugin {
  return {
    name: 'compodium:devtools',
    config(config) {
      if (process.env.COMPODIUM_DEVTOOLS_URL) {
        config.server ||= {}
        config.server.proxy ||= {}
        config.server.proxy['/__compodium__/devtools'] = {
          target: process.env.COMPODIUM_DEVTOOLS_URL,
          changeOrigin: true,
          followRedirects: true
        }
      }
    },

    configureServer(server) {
      if (process.env.COMPODIUM_DEVTOOLS_URL) return

      server.middlewares.use('/__compodium__/devtools',
        sirv(
          // TODO: Fix resolution. This will break in production
          resolve('../../packages/core/dist/client/devtools'),
          { single: true }
        )
      )
    },

    resolveId(id) {
      if (id === 'virtual:compodium:preview') {
        const userPreview = resolve(process.cwd(), config.dir ?? 'compodium/', 'preview.vue')
        if (existsSync(userPreview)) {
          return userPreview
        }
        return '\0virtual:compodium:preview'
      }
    },

    load(id) {
      if (id === '\0virtual:compodium:preview') {
        const userPreview = resolve(process.cwd(), 'compodium/preview.vue')
        if (existsSync(userPreview)) {
          return readFileSync(userPreview, 'utf-8')
        }
        return `export { default } from '@compodium/core/runtime/preview.vue'`
      }
    }
  }
}
