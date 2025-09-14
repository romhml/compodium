import { readFile } from 'node:fs/promises'
import type { Collection, PluginOptions } from '../../types'
import { createChecker } from './checker'
import { watch } from 'chokidar'
import type { Plugin } from 'vite'

import AST from 'unplugin-ast/vite'
import { resolveCollections } from '../collections'

const VIRTUAL_MODULE_ID = 'virtual:compodium/meta'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export function extendMetaPlugin(_options: PluginOptions): Plugin {
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

export function metaPlugin(options: PluginOptions): Plugin {
  let collections: Collection[]
  let checker: any
  let server: any

  return {
    name: 'compodium:meta',
    enforce: 'pre',
    apply: 'serve',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
    },

    resolveId(id) {
      if (id.startsWith(VIRTUAL_MODULE_ID)) {
        return RESOLVED_VIRTUAL_MODULE_ID + id.slice(VIRTUAL_MODULE_ID.length)
      }
    },

    async load(id) {
      if (id.startsWith(RESOLVED_VIRTUAL_MODULE_ID)) {
        const url = new URL(id.slice(1), 'http://localhost') // Remove the \0 prefix
        const componentPath = url.searchParams.get('component')

        if (!componentPath) {
          return 'export default null'
        }

        if (!checker) {
          return 'export default null'
        }

        const meta = checker.getComponentMeta(componentPath)
        return `export default ${JSON.stringify(meta, null, 2)}`
      }
    },

    configureServer(_server) {
      server = _server

      const checkerDirs = collections.flatMap(c => [
        ...c.dirs,
        c.exampleDir
      ])
      checker = createChecker(checkerDirs)

      // Existing middleware endpoint
      server.middlewares.use('/__compodium__/api/meta', async (req: any, res: any) => {
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

      const componentCollection = collections.find(c => c.name === 'Components') as Collection

      const watchedPaths = [
        ...componentCollection.dirs,
        componentCollection.exampleDir
      ].map(d => d.path)

      const invalidateVirtualModuleForFile = (filePath: string) => {
        const virtualModuleId = `${RESOLVED_VIRTUAL_MODULE_ID}?component=${encodeURIComponent(filePath)}`
        const module = server.moduleGraph.getModuleById(virtualModuleId)
        if (module) {
          server.reloadModule(module)
        }
      }

      const invalidateAllVirtualModules = () => {
        // Only for add events where we need to reload all modules
        for (const [id, module] of server.moduleGraph.idToModuleMap) {
          if (id.startsWith(RESOLVED_VIRTUAL_MODULE_ID)) {
            server.reloadModule(module)
          }
        }
      }

      const watcher = watch(watchedPaths, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      watcher.on('add', async () => {
        checker.reload()
        invalidateAllVirtualModules()
      })

      watcher.on('change', async (filePath: string) => {
        if (watchedPaths.find(p => filePath.startsWith(p))) {
          const code = await readFile(filePath, 'utf-8')
          checker.updateFile(filePath, code)

          // Existing WebSocket HMR
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:changed' }
          })

          // Virtual module invalidation for specific file
          invalidateVirtualModuleForFile(filePath)
        }
      })
    }
  }
}
