import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '../types'

import { COLLECTIONS_MODULE_ID } from './collections'
import { COLORS_MODULE_ID } from './colors'
import { EXAMPLE_MODULE_ID } from './examples'
import { META_MODULE_ID } from './meta'

function normalizeTransportQuery(searchParams: URLSearchParams): string {
  const semanticParams = new URLSearchParams()
  for (const [key, value] of searchParams) {
    if (key === 'import' && value === '') continue
    semanticParams.append(key, value)
  }
  const query = semanticParams.toString()
  return query ? `?${query}` : ''
}

export function moduleProxyPlugin(options: PluginOptions): VitePlugin {
  let viteBase = '/'

  return {
    name: 'compodium:module-proxy',
    apply: 'serve',
    enforce: 'pre',

    configResolved(viteConfig) {
      viteBase = viteConfig.base
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        const requestUrl = new URL(req.url, 'http://compodium.local')
        let moduleId: string
        switch (requestUrl.pathname) {
          case '/__compodium__/modules/collections':
            moduleId = COLLECTIONS_MODULE_ID
            break
          case '/__compodium__/modules/meta':
            moduleId = META_MODULE_ID
            break
          case '/__compodium__/modules/example':
            moduleId = EXAMPLE_MODULE_ID
            break
          case '/__compodium__/modules/colors':
            moduleId = COLORS_MODULE_ID
            break
          default:
            return next()
        }

        const query = normalizeTransportQuery(requestUrl.searchParams)
        if (options._nuxt) {
          try {
            const result = await server.transformRequest(`${moduleId}${query}`)
            if (!result) return next()
            res.setHeader('Content-Type', 'text/javascript')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(result.code)
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(error instanceof Error ? error.message : String(error))
          }
          return
        }

        const base = viteBase === '/' ? '' : viteBase.replace(/\/$/, '')
        req.url = `${base}/@id/${moduleId}${query}`
        next()
      })
    }
  }
}
