import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '../types'

const MODULE_PREFIX = '/__compodium__/modules/'
const MODULE_NAMES = new Set(['collections', 'meta', 'example', 'colors'])

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
        if (!requestUrl.pathname.startsWith(MODULE_PREFIX)) return next()

        const moduleName = requestUrl.pathname.slice(MODULE_PREFIX.length)
        if (!MODULE_NAMES.has(moduleName)) return next()

        const query = normalizeTransportQuery(requestUrl.searchParams)
        if (options._nuxt) {
          try {
            const result = await server.transformRequest(`virtual:compodium:${moduleName}${query}`)
            if (!result) return next()
            res.setHeader('Content-Type', 'text/javascript')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(result.code)
          } catch (error) {
            next(error)
          }
          return
        }

        req.url = `${requestUrl.pathname}${query}`
        if (viteBase === '/') return next()

        const base = viteBase.endsWith('/') ? viteBase.slice(0, -1) : viteBase
        req.url = `${base}/@id/virtual:compodium:${moduleName}${query}`
        next()
      })
    }
  }
}
