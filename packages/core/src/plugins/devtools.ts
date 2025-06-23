import type { VitePlugin } from 'unplugin'
import sirv from 'sirv'
import type { PluginConfig } from '../types'
import { resolve, dirname } from 'pathe'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { joinURL } from 'ufo'
import { createRequire } from 'node:module'

export function devtoolsPlugin(config: PluginConfig): VitePlugin {
  const require = createRequire(import.meta.url)
  const userPreview = resolve(joinURL(config.rootDir, config.dir, 'preview.vue'))

  return {
    name: 'compodium:devtools',
    config(config) {
      if (process.env.COMPODIUM_DEVTOOLS_URL) {
        config.server ||= {}
        config.server.proxy ||= {}
        config.server.proxy['/__compodium__/devtools'] = {
          target: process.env.COMPODIUM_DEVTOOLS_URL,
          ws: true,
          rewriteWsOrigin: true,
          changeOrigin: true,
          followRedirects: true
        }
      }
    },

    configureServer(server) {
      if (process.env.COMPODIUM_DEVTOOLS_URL || process.env.COMPODIUM_TEST) return
      server.middlewares.use('/__compodium__/devtools',
        sirv(resolve(dirname(fileURLToPath(import.meta.url)), './client/devtools'),
          { single: true, setHeaders: res => res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400') }
        )
      )
    },

    resolveId(id) {
      if (id === 'virtual:compodium:preview') {
        if (existsSync(userPreview)) {
          return userPreview
        }
        return require.resolve('../runtime/preview.vue')
      }
    }
  }
}
