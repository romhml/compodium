import fs from 'node:fs/promises'
import type { VitePlugin } from 'unplugin'
import type { PluginConfig } from '../types'
import { resolve } from 'node:path'

export function examplePlugin(config: PluginConfig): VitePlugin {
  return {
    name: 'compodium:examples',

    configureServer(server) {
      const paths = [
        config.componentCollection.exampleDir,
        ...config.libraryCollections.map(c => c.exampleDir)
      ].map(d => resolve(config.rootDir, d.path))

      server.middlewares.use('/__compodium__/api/example', async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const path = url.searchParams.get('path')

          if (!path) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Example path is required' }))
            return
          }

          if (!paths.find(p => path.startsWith(p))) {
            res.statusCode = 403
            res.end(JSON.stringify({ error: 'Forbidden' }))
            return
          }

          const exampleCode = await fs.readFile(path)

          const result = exampleCode.toString()
            .replace(/extendCompodiumMeta\s*\([\s\S]*?\)\s*;?/g, '')
            .replace(/<script [^>]*>\s<\/\s*script\s*>/g, '')

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
