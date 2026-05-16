import { libraryCollections as libraryCollectionsConfig } from '@compodium/examples'
import type { PluginOptions, Collection } from '../types'
import { scanComponents } from './utils'
import { watch } from 'chokidar'
import type { VitePlugin } from 'unplugin'
import { resolve } from 'pathe'
import { joinURL } from 'ufo'
import type { ResolvedConfig } from 'vite'
import type { Component } from 'vue'
import { parseCompodiumMeta } from './meta/compodium-meta'
import { defu } from 'defu'

export function resolveCollections(options: PluginOptions, viteConfig: ResolvedConfig): Collection[] {
  const rootDir = options.rootDir ?? viteConfig.root

  const exampleDir = {
    path: joinURL(rootDir, options.dir, 'examples'),
    pattern: '**/*.{vue,tsx}'
  }

  const componentDirs = options?.componentDirs.map((dir) => {
    const componentDir = typeof dir === 'string' ? { path: dir } : dir
    return {
      pattern: '**/*.{vue,tsx}',
      ...componentDir,
      path: resolve(rootDir, componentDir.path),
      ignore: (componentDir.ignore ?? []).concat(options.ignore ?? [])
    }
  }).filter(collection => !collection.path?.includes('node_modules/'))

  const componentCollection: Collection = {
    name: 'Components',
    exampleDir,
    dirs: componentDirs
  }

  const libraryCollections = options.includeLibraryCollections
    ? libraryCollectionsConfig.map(collection => ({
        ...collection,
        exampleDir: {
          path: collection.exampleDir,
          pattern: '**/*.{vue,tsx}',
          prefix: collection.prefix
        },
        dirs: [{
          path: collection.path,
          pattern: '**/*.{vue,tsx}',
          ignore: collection.ignore,
          prefix: collection.prefix
        }]
      }))
    : []

  return [
    componentCollection,
    ...libraryCollections
  ]
}

export function collectionsPlugin(options: PluginOptions): VitePlugin {
  let collections: Collection[]

  return {
    name: 'compodium:collections',
    apply: 'serve',
    enforce: 'post',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
    },

    configureServer(server) {
      server.middlewares.use('/__compodium__/api/collections', async (_, res) => {
        try {
          const result = await Promise.all(collections.map(async (col) => {
            const components = await scanComponents(col.dirs)
            const examples = await scanComponents([col.exampleDir])

            const collectionComponents: Component[] = []

            for (const c of components) {
              const componentMeta = await parseCompodiumMeta(c.filePath)

              const componentExamples = await Promise.all(examples?.filter(e => e.pascalName.startsWith(`${c.pascalName}Example`)).map(async e => ({
                ...e,
                isExample: true,
                componentPath: c.filePath,
                componentName: c.pascalName,
                collectionName: col.name,
                ...defu(componentMeta, await parseCompodiumMeta(e.filePath))
              })))

              const mainExample = componentExamples.find(e => e.pascalName === `${c.pascalName}Example`)
              const component = mainExample ?? c

              // Hides third party library components if no example can be found.
              if (col.name !== 'Components' && !mainExample) continue

              collectionComponents.push({
                ...componentMeta,
                ...component,
                wrapperComponent: col.wrapperComponent,
                docUrl: col.getDocUrl?.(c.pascalName),
                examples: componentExamples.filter(e => e.pascalName !== mainExample?.pascalName)
              })
            }

            return {
              ...col,
              components: collectionComponents
            }
          }))

          res.setHeader('Content-Type', 'application/json')
          res.write(JSON.stringify(result))
          res.end()
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to fetch collections' }))
        }
      })

      const componentCollection = collections.find(c => c.name === 'Components') as Collection

      const watchedPaths = [
        ...componentCollection.dirs,
        componentCollection.exampleDir
      ].map(d => d.path)

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
