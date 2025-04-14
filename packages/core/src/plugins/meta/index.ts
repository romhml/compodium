import { readFile } from 'node:fs/promises'
import type { PluginConfig } from '../../types'
import { createChecker } from './checker'
import { watch } from 'chokidar'
import type { VitePlugin } from 'unplugin'
import { resolve } from 'pathe'

import AST from 'unplugin-ast/vite'
import type { Transformer } from 'unplugin-ast'
import type { CallExpression } from '@babel/types'

const RemoveFunction = (
  functionNames: string[]
): Transformer<CallExpression> => ({
  onNode: node =>
    node.type === 'CallExpression'
    && node.callee.type === 'Identifier'
    && functionNames.includes(node.callee.name),

  transform() {
    return null
  }
})

export function extendMetaPlugin(_config: PluginConfig): VitePlugin {
  return AST({
    include: [/\.[jt]sx?$/, /\.vue$/],
    transformer: [RemoveFunction(['extendCompodiumMeta'])]
  })
}

export function metaPlugin(config: PluginConfig): VitePlugin {
  const checkerDirs = [
    ...config.componentCollection.dirs,
    config.componentCollection.exampleDir,
    ...config.libraryCollections.flatMap(c => c.dirs),
    ...config.libraryCollections.map(c => c.exampleDir)
  ]

  const checker = createChecker(checkerDirs)

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

      const watchedPaths = [
        ...config.componentCollection.dirs,
        config.componentCollection.exampleDir
      ].map(d => resolve(config.rootDir, d.path))

      // Watch for changes in example directory
      const watcher = watch(watchedPaths, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      watcher.on('add', async () => {
        checker.reload()
      })

      watcher.on('change', async (filePath: string) => {
        if (watchedPaths.find(p => filePath.startsWith(p))) {
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
