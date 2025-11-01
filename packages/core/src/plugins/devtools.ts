import type { VitePlugin } from 'unplugin'
import sirv from 'sirv'
import type { PluginOptions } from '../types'
import { resolve, dirname } from 'pathe'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { joinURL } from 'ufo'
import { resolvePathSync } from 'mlly'

export function devtoolsPlugin(options: PluginOptions): VitePlugin {
  let userPreview: string

  return {
    name: 'compodium:devtools',
    enforce: 'pre',
    apply: 'serve',

    configResolved(viteConfig) {
      userPreview = resolve(joinURL(options.rootDir ?? viteConfig.root, options.dir, 'preview.vue'))
    },

    configureServer(server) {
      if (process.env.COMPODIUM_DEVTOOLS_URL || process.env.VITEST) return
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
        return resolvePathSync('../runtime/preview.vue', { extensions: ['.vue'], url: import.meta.url })
      }
    }
  }
}
