import fs from 'node:fs/promises'
import type { VitePlugin } from 'unplugin'
import type { Collection, PluginOptions } from '../types'
import { resolveCollections } from './collections'
import { getRealPath, isPathInside } from './utils'

export function examplePlugin(options: PluginOptions): VitePlugin {
  let collections: Collection[]

  return {
    name: 'compodium:examples',
    apply: 'serve',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
    },

    async configureServer(server) {
      const allowedRoots = await Promise.all(
        collections.flatMap(c => c.exampleDirs.map(dir => getRealPath(dir.path)))
      )
      server.middlewares.use('/__compodium__/api/example', async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const requestedPath = url.searchParams.get('path')

          if (!requestedPath) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Example path is required' }))
            return
          }

          const canonicalPath = await getRealPath(requestedPath)
          if (!allowedRoots.some(root => isPathInside(canonicalPath, root))) {
            res.statusCode = 403
            res.end(JSON.stringify({ error: 'Forbidden' }))
            return
          }

          const exampleCode = await fs.readFile(canonicalPath)

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
