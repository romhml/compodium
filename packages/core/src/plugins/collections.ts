import { libraryCollections as libraryCollectionsConfig } from '@compodium/examples'
import type { PluginOptions, Collection, Component, ComponentCollection } from '../types'
import { scanComponents } from './utils'
import type { VitePlugin } from 'unplugin'
import { isAbsolute, relative, resolve } from 'pathe'
import { joinURL } from 'ufo'
import { parseCompodiumMeta } from './meta/compodium-meta'

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

  return true
}

export function resolveCollections(options: PluginOptions, viteConfig: any): Collection[] {
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
          path: resolve(rootDir, collection.path),
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

export async function assembleCollections(collections: Collection[]): Promise<ComponentCollection[]> {
  return await Promise.all(collections.map(async (col) => {
    const components = await scanComponents(col.dirs)
    const examples = await scanComponents([col.exampleDir])

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
  let viteBase = '/'
  let watchedPaths: string[] = []
  let removeWatcherListeners: (() => void) | undefined

  return {
    name: 'compodium:collections',
    apply: 'serve',
    enforce: 'post',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
      viteBase = viteConfig.base
      watchedPaths = collections.flatMap(collection => [
        ...collection.dirs.map(dir => dir.path),
        collection.exampleDir.path
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
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        const [path = '', query = ''] = req.url.split(/(?=\?)/, 2)
        if (!path.startsWith('/__compodium__/modules/')) return next()

        const moduleName = path.slice('/__compodium__/modules/'.length)
        if (!['collections', 'meta', 'example', 'colors'].includes(moduleName)) return next()

        if (options._nuxt) {
          try {
            const result = await server.transformRequest(`virtual:compodium:${moduleName}${query}`)
            if (!result) return next()
            res.setHeader('Content-Type', 'text/javascript')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(result.code)
          } catch (error) {
            next(error)
          }
          return
        }

        if (viteBase === '/') return next()

        const base = viteBase.endsWith('/') ? viteBase.slice(0, -1) : viteBase
        req.url = `${base}/@id/virtual:compodium:${moduleName}${query}`
        next()
      })

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
