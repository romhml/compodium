import type { PluginOptions } from '../types'
import { scanComponents } from './utils'
import { joinURL } from 'ufo'
import { watch } from 'chokidar'
import type { VitePlugin } from 'unplugin'

export function collectionsPlugin(options: PluginOptions): VitePlugin {
  const dirs = options?.componentDirs.map((dir) => {
    const path = typeof dir === 'string' ? dir : dir.path
    return {
      ...typeof dir === 'string' ? {} : dir,
      path,
      name: 'Components',
      id: 'components',
      pattern: '**/*.{vue,ts,tsx}'
    }
  }).filter(collection => !collection.path?.includes('node_modules/'))

  const exampleDir = {
    path: joinURL(options.rootDir, options.dir, 'examples'),
    pattern: '**/*.{vue,ts,tsx}'
  }

  const paths = [...dirs, exampleDir]?.map(c => c.path)

  return {
    name: 'compodium:collections',

    configureServer(server) {
      server.middlewares.use('/__compodium__/api/collections', async (_, res) => {
        const components = await scanComponents(dirs, options.rootDir)

        const examples = await scanComponents([exampleDir], options.rootDir)

        const collectionComponents = components.map((c) => {
          const componentExamples = examples?.filter(e => e.pascalName.startsWith(`${c.pascalName}Example`)).map(e => ({
            ...e,
            isExample: true,
            componentPath: c.filePath
          }))

          const mainExample = componentExamples.find(e => e.pascalName === `${c.pascalName}Example`)

          return {
            ...(mainExample ?? c),
            examples: componentExamples.filter(e => e.pascalName !== mainExample?.pascalName)
          }
        })

        const collections = [
          { name: 'Components', id: 'components', components: collectionComponents }
        ]

        res.setHeader('Content-Type', 'application/json')
        res.write(JSON.stringify(collections))
        res.end()
      })

      // Watch for changes in example directory
      const watcher = watch(paths, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      watcher.on('add', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:added' }
          })
        }
      })

      watcher.on('addDir', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:added' }
          })
        }
      })

      watcher.on('unlink', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
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
