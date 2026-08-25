import { readFile } from 'node:fs/promises'
import type { Collection, PluginOptions } from '../../types'
import { createChecker } from './checker'
import { watch } from 'chokidar'
import type { VitePlugin } from 'unplugin'

import AST from 'unplugin-ast/vite'
import { resolveCollections } from '../collections'

export function extendMetaPlugin(_options: PluginOptions): VitePlugin {
  return AST({
    include: [/\.[jt]sx?$/, /\.vue$/],
    enforce: 'post',
    transformer: [
      {
        onNode(node) {
          return node.type === 'CallExpression'
            && node.callee.type === 'Identifier'
            && node.callee.name === 'extendCompodiumMeta'
        },
        transform: () => false
      }
    ]
  })
}

export function metaPlugin(options: PluginOptions): VitePlugin {
  let collections: Collection[]
  let rootDir: string

  return {
    name: 'compodium:meta',
    enforce: 'pre',
    apply: 'serve',

    configResolved(viteConfig) {
      rootDir = options.rootDir ?? viteConfig.root
      collections = resolveCollections(options, viteConfig)
    },

    async configureServer(server) {
      const checkerDirs = collections.flatMap(c => [
        ...c.dirs,
        ...c.exampleDirs
      ])
      let checker: Awaited<ReturnType<typeof createChecker>>

      try {
        checker = await createChecker(checkerDirs, rootDir, options.tsconfigPath)
      } catch {
        server.config.logger.warn('[Compodium] Unable to parse component props. TypeScript 7 is not supported; use TypeScript 6 instead.')
        server.middlewares.use('/__compodium__/api/meta', (_req, res) => {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Metadata unavailable' }))
        })
        return
      }

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
          res.end(JSON.stringify({ error: 'Metadata unavailable' }))
        }
      })

      const componentCollection = collections.find(c => c.name === 'Components') as Collection

      const watchedPaths = [
        ...componentCollection.dirs,
        ...componentCollection.exampleDirs
      ].map(d => d.path)

      // Watch for changes in example directory
      const watcher = watch(watchedPaths, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      watcher.on('add', () => {
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
