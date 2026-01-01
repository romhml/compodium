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

        if (!componentPath || !checker) {
          return 'export default null'
        }

        const meta = checker.getComponentMeta(componentPath)
        console.log(componentPath, meta)

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
      const componentCollection = collections.find(c => c.name === 'Components') as Collection

      const watchedPaths = [
        ...componentCollection.dirs,
        componentCollection.exampleDir
      ].map(d => d.path)

      const invalidateComponentMeta = (filePath: string) => {
        const virtualModuleId = `${RESOLVED_VIRTUAL_MODULE_ID}?component=${encodeURIComponent(filePath)}`
        const module = server.moduleGraph.getModuleById(virtualModuleId)
        if (module) {
          server.reloadModule(module)
        }
      }

      const watcher = watch(watchedPaths, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      watcher.on('add', async (filePath: string) => {
        checker.reload()
        invalidateComponentMeta(filePath)
      })

      watcher.on('change', async (filePath: string) => {
        if (watchedPaths.find(p => filePath.startsWith(p))) {
          console.log('update')
          const code = await readFile(filePath, 'utf-8')
          checker.updateFile(filePath, code)
          invalidateComponentMeta(filePath)
        }
      })
    }
  }
}
