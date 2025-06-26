import fs from 'node:fs/promises'
import type { VitePlugin } from 'unplugin'
import type { Collection, PluginOptions } from '../types'
import { resolveCollections } from './collections'

export function examplePlugin(options: PluginOptions): VitePlugin {
  let collections: Collection[]

  return {
    name: 'compodium:examples',
    apply: 'serve',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
    },

    configureServer(server) {
      const allowedPaths = collections.map(c => c.exampleDir.path)
      server.middlewares.use('/__compodium__/api/example', async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const path = url.searchParams.get('path')

          if (!path) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Example path is required' }))
            return
          }

          if (!allowedPaths.find(p => path.startsWith(p))) {
            res.statusCode = 403
            res.end(JSON.stringify({ error: 'Forbidden', message: `${allowedPaths}\n ${path}` }))
            return
          }

          const exampleCode = await fs.readFile(path)

          let result = exampleCode.toString()
            .replace(/extendCompodiumMeta\s*\([\s\S]*?\)\s*;?/g, '')

          if (options._nuxt) {
            result = result
              .replace(/import .* from 'vue'/, '')
          }

          result = result.replace(/<script[^>]*>\s*<\/script>/g, '')

          res.setHeader('Content-Type', 'text/plain')
          res.end(result)
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to fetch example code' }))
        }
      })
    }
  }
}
