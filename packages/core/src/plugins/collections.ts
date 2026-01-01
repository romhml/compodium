import { libraryCollections as libraryCollectionsConfig } from '@compodium/examples'
import type { PluginOptions, Collection, Component } from '../types'
import { scanComponents } from './utils'
import { watch } from 'chokidar'
import type { VitePlugin } from 'unplugin'
import { resolve } from 'pathe'
import { joinURL } from 'ufo'
import type { ResolvedConfig } from 'vite'
import { defu } from 'defu'

import { parseCompodiumMeta } from './meta/compodium-meta'

const VIRTUAL_MODULE_ID = 'virtual:compodium/collections'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

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

async function generateCollectionsData(collections: Collection[]) {
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
        ...defu(componentMeta, await parseCompodiumMeta(c.filePath))
      })))

      const mainExample = componentExamples.find(e => e.pascalName === `${c.pascalName}Example`)
      const component = mainExample ?? c

      if (col.name !== 'Components' && !mainExample) return []

      collectionComponents.push({
        ...componentMeta,
        ...component,
        wrapperComponent: col.wrapperComponent,
        docUrl: col.getDocUrl?.(c.pascalName),
        examples: componentExamples.filter(e => e.pascalName !== mainExample?.pascalName),
        collectionName: col.name
      })
    }

    return {
      ...col,
      components: await collectionComponents
    }
  }))

  return result
}

export function collectionsPlugin(options: PluginOptions): VitePlugin {
  let collections: Collection[]
  let server: any

  return {
    name: 'compodium:collections',
    apply: 'serve',
    enforce: 'pre',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const data = await generateCollectionsData(collections)
        return `export default ${JSON.stringify(data, null, 2)}`
      }
    },

    configureServer(_server) {
      server = _server

      const componentCollection = collections.find(c => c.name === 'Components') as Collection

      const watchedPaths = [
        ...componentCollection.dirs,
        componentCollection.exampleDir
      ].map(d => d.path)

      const watcher = watch(watchedPaths, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      const handleFileChange = async () => {
        // Virtual module invalidation
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
        if (mod) server.reloadModule(mod)
      }

      watcher.on('add', handleFileChange)
      watcher.on('addDir', handleFileChange)
      watcher.on('unlink', handleFileChange)
    }
  }
}
