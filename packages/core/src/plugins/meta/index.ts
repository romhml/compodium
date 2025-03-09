import { readFile } from 'node:fs/promises'
import type { PluginOptions } from '../../types'
import { createChecker } from './checker'
import { joinURL } from 'ufo'
import { watch } from 'chokidar'
import type { VitePlugin } from 'unplugin'

export function metaPlugin(options: PluginOptions): VitePlugin {
  const dirs = options?.componentDirs.map((dir) => {
    const path = typeof dir === 'string' ? dir : dir.path
    return {
      ...typeof dir === 'string' ? {} : dir,
      path,
      pattern: '**/*.{vue,ts,tsx}'
    }
  })

  const exampleDir = {
    path: joinURL(options.rootDir, options.dir, 'examples'),
    pattern: '**/*.{vue,ts,tsx}'
  }

  dirs.push(exampleDir)

  const checker = createChecker(dirs)
  const paths = dirs.map(d => d.path)

  return {
    name: 'compodium:meta',

    configureServer(server) {
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

      // Watch for changes in example directory
      const examplesWatcher = watch(paths, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      examplesWatcher.on('add', async () => {
        checker.reload()
      })

      examplesWatcher.on('change', async (filePath: string) => {
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
    }
  }
}
