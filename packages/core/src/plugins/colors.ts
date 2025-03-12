import type { VitePlugin } from 'unplugin'
import type { PluginConfig } from '../types'

/**
 * This plugin is responsible for getting the generated virtual templates and
 * making them available to the Vue build.
 */
export function colorsPlugin(config: PluginConfig): VitePlugin {
  return {
    name: 'compodium:colors',
    configureServer(server) {
      server.middlewares.use('/__compodium__/api/colors', async (req, res) => {
        try {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(config.extras?.colors))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: `Failed to fetch iconify API: ${err}` }))
        }
      })
    }

  }
}
