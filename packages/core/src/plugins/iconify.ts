import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '../types'
import { joinURL } from 'ufo'

export function iconifyPlugin(_options: PluginOptions): VitePlugin {
  return {
    name: 'compodium:iconify',
    enforce: 'pre',
    apply: 'serve',

    configureServer(server) {
      server.middlewares.use('/__compodium__/api/iconify', async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const q = decodeURIComponent(url.searchParams.get('q') ?? '')

          const resp = await fetch(joinURL('https://api.iconify.design', q as string))

          if (!resp.ok) {
            res.statusCode = resp.status
            res.end(await resp.text())
            return
          }

          const result = await resp.json()
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'public, max-age=604800') // 604800 seconds = 1 week
          res.end(JSON.stringify(result))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: `Failed to fetch iconify API: ${err}` }))
        }
      })
    }
  }
}
