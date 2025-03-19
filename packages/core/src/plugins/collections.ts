import type { PluginConfig } from '../types'
import { scanComponents } from './utils'
import { watch } from 'chokidar'
import type { VitePlugin } from 'unplugin'
import { resolve } from 'pathe'

export function collectionsPlugin(config: PluginConfig): VitePlugin {
  return {
    name: 'compodium:collections',
    configureServer(server) {
      server.middlewares.use('/__compodium__/api/collections', async (_, res) => {
        try {
          const collections = await Promise.all([config.componentCollection, ...config.libraryCollections].map(async (col) => {
            const components = await scanComponents(col.dirs, config.rootDir)
            const examples = await scanComponents([col.exampleDir], config.rootDir)

            const collectionComponents = components.map((c) => {
              const componentExamples = examples?.filter(e => e.pascalName.startsWith(`${c.pascalName}Example`)).map(e => ({
                ...e,
                isExample: true,
                componentPath: resolve(config.rootDir, c.filePath)
              }))

              const mainExample = componentExamples.find(e => e.pascalName === `${c.pascalName}Example`)
              const component = mainExample ?? c

              return {
                ...component,
                wrapperComponent: col.wrapperComponent,
                docUrl: col.getDocUrl?.(c.pascalName),
                examples: componentExamples.filter(e => e.pascalName !== mainExample?.pascalName)
              }
            })

            return {
              ...col,
              components: collectionComponents
            }
          }))

          res.setHeader('Content-Type', 'application/json')
          res.write(JSON.stringify(collections))
          res.end()
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to fetch collections' }))
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

      watcher.on('add', async (filePath: string) => {
        if (watchedPaths.find(p => filePath.startsWith(p))) {
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:added' }
          })
        }
      })

      watcher.on('addDir', async (filePath: string) => {
        if (watchedPaths.find(p => filePath.startsWith(p))) {
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:added' }
          })
        }
      })

      watcher.on('unlink', async (filePath: string) => {
        if (watchedPaths.find(p => filePath.startsWith(p))) {
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:removed' }
          })
        }
      })
    }
  }
}
