import type { VitePlugin } from 'unplugin'
import sirv from 'sirv'
import type { PluginConfig } from '../types'
import { resolve } from 'pathe'

export function devtoolsPlugin(_config: PluginConfig): VitePlugin {
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
    }
  }
}
