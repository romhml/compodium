import { readFile } from 'node:fs/promises'
import type { PluginOptions } from '../../types'
import { createChecker } from './checker'
import type { ViteDevServer } from 'vite'

export function metaPlugin(options: PluginOptions) {
  const dirs = options?.componentDirs.map((dir) => {
    const path = typeof dir === 'string' ? dir : dir.path
    return {
      ...typeof dir === 'string' ? {} : dir,
      path,
      name: 'Components',
      id: 'components',
      pattern: '**/*.{vue,ts,tsx}'
    }
  })

  const checker = createChecker(dirs)
  const paths = dirs.map(d => d.path)

  return {
    name: 'compodium:meta',

    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__compodium__/api/meta', async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const componentPath = url.searchParams.get('component')

          if (!componentPath) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Component path is required' }))
            return
          }

          const meta = checker.getComponentMeta(componentPath)

          if (!meta) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Component not found' }))
            return
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(meta))
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to fetch metadata' }))
        }
      })
    },

    handleHotUpdate({ server }: { server: ViteDevServer }) {
      server.watcher.on('change', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
          const code = await readFile(filePath, 'utf-8')
          checker.updateFile(filePath, code)

          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:changed' }
          })
        }
      })

      server.watcher.on('add', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
          checker.reload()
        }
      })
    }
  }
}
