import { libraryCollections as libraryCollectionsConfig } from '@compodium/examples'
import type { PluginOptions, Collection, Component, ComponentCollection } from '../types'
import { scanComponents } from './utils'
import type { VitePlugin } from 'unplugin'
import { dirname, isAbsolute, relative, resolve } from 'pathe'
import { joinURL } from 'ufo'
import { parseCompodiumMeta } from './meta/compodium-meta'
import { fileURLToPath } from 'node:url'

export const COLLECTIONS_MODULE_ID = 'virtual:compodium:collections'
export const RESOLVED_COLLECTIONS_MODULE_ID = `\0${COLLECTIONS_MODULE_ID}`
export const COLLECTIONS_BROWSER_ALIAS = '/__compodium__/modules/collections'

function isPathInside(rootPath: string, filePath: string): boolean {
  const relativePath = relative(rootPath, filePath)
  return relativePath === '' || (!relativePath.startsWith('../') && relativePath !== '..' && !isAbsolute(relativePath))
}

function isCollectionsModuleRequest(id: string): boolean {
  const queryIndex = id.indexOf('?')
  const moduleId = queryIndex === -1 ? id : id.slice(0, queryIndex)
  if (moduleId !== COLLECTIONS_MODULE_ID && moduleId !== COLLECTIONS_BROWSER_ALIAS) return false

  const query = queryIndex === -1 ? '' : id.slice(queryIndex + 1)
  const entries = [...new URLSearchParams(query)]
  if (entries.length === 0) return true
  if (entries.length === 1 && entries[0]![0] === 't' && /^\d{13}$/.test(entries[0]![1])) return true

  throw new Error(`Unsupported Compodium collections module query: ?${query}`)
}

export function resolveCollections(options: PluginOptions, viteConfig: any): Collection[] {
  const rootDir = options.rootDir ?? viteConfig.root
  const rootDirs = options._rootDirs ?? [rootDir]
  const exampleDirs = rootDirs.map(root => ({
    path: joinURL(root, options.dir, 'examples'),
    pattern: '**/*.{vue,tsx}'
  }))

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
    exampleDirs,
    dirs: componentDirs
  }

  const libraryCollections = options.includeLibraryCollections
    ? libraryCollectionsConfig.flatMap((collection) => {
        let pkgPath
        try {
          pkgPath = dirname(fileURLToPath(import.meta.resolve(collection.package)))
        } catch {
          return []
        }

        return [{
          ...collection,
          exampleDirs: collection.exampleDirs.map(examplePath => ({
            path: resolve(examplePath),
            pattern: '**/*.{vue,tsx}',
            prefix: collection.prefix
          })),
          dirs: [{
            path: resolve(pkgPath, collection.path),
            pattern: '**/*.{vue,tsx}',
            ignore: collection.ignore,
            prefix: collection.prefix
          }]
        }]
      })
    : []

  return [
    componentCollection,
    ...libraryCollections
  ]
}

export async function assembleCollections(collections: Collection[]): Promise<ComponentCollection[]> {
  return await Promise.all(collections.map(async (col) => {
    const components = await scanComponents(col.dirs)
    const examples = await scanComponents(col.exampleDirs)

    const collectionComponents: Component[] = []

    for (const c of components) {
      const componentMeta = await parseCompodiumMeta(c.filePath)

      const componentExamples = await Promise.all(examples?.filter(e => e.pascalName.startsWith(`${c.pascalName}Example`)).map(async e => ({
        ...e,
        isExample: true as const,
        componentPath: c.filePath,
        componentName: c.pascalName,
        collectionName: col.name,
        ...(await parseCompodiumMeta(e.filePath) ?? componentMeta)
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
}

export function collectionsPlugin(options: PluginOptions): VitePlugin {
  let collections: Collection[]
  let watchedPaths: string[] = []
  let removeWatcherListeners: (() => void) | undefined

  return {
    name: 'compodium:collections',
    apply: 'serve',
    enforce: 'post',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
      watchedPaths = collections.flatMap(collection => [
        ...collection.dirs.map(dir => dir.path),
        ...collection.exampleDirs.map(dir => dir.path)
      ])
    },

    resolveId(id) {
      if (!isCollectionsModuleRequest(id)) return
      return RESOLVED_COLLECTIONS_MODULE_ID
    },

    async load(id) {
      if (id !== RESOLVED_COLLECTIONS_MODULE_ID) return

      const result = await assembleCollections(collections)
      return `export default ${JSON.stringify(result)};`
    },

    configureServer(server) {
      removeWatcherListeners?.()
      server.watcher.add(watchedPaths)

      const isWatchedPath = (filePath: string) => watchedPaths.some(root => isPathInside(root, filePath))
      const notifyStructuralChange = (event: 'component:added' | 'component:removed') => (filePath: string) => {
        if (!isWatchedPath(filePath)) return
        server.ws.send({
          type: 'custom',
          event: 'compodium:hmr',
          data: { path: filePath, event }
        })
      }
      const handleAdd = notifyStructuralChange('component:added')
      const handleRemove = notifyStructuralChange('component:removed')

      server.watcher.on('add', handleAdd)
      server.watcher.on('addDir', handleAdd)
      server.watcher.on('unlink', handleRemove)
      server.watcher.on('unlinkDir', handleRemove)

      removeWatcherListeners = () => {
        server.watcher.off('add', handleAdd)
        server.watcher.off('addDir', handleAdd)
        server.watcher.off('unlink', handleRemove)
        server.watcher.off('unlinkDir', handleRemove)
      }
      server.httpServer?.once('close', removeWatcherListeners)
    },

    handleHotUpdate({ file, server }) {
      if (!watchedPaths.some(root => isPathInside(root, file))) return
      server.ws.send({
        type: 'custom',
        event: 'compodium:hmr',
        data: { path: file, event: 'component:changed' }
      })
    },

    closeBundle() {
      removeWatcherListeners?.()
      removeWatcherListeners = undefined
    }
  }
}
