import { readFile, realpath } from 'node:fs/promises'
import type { Collection, CompodiumMeta, PluginOptions } from '../../types'
import { createChecker } from './checker'
import { watch } from 'chokidar'
import type { VitePlugin } from 'unplugin'
import { isAbsolute, relative } from 'pathe'

import AST from 'unplugin-ast/vite'
import { resolveCollections } from '../collections'
import { parseCompodiumMeta } from './compodium-meta'

const META_MODULE_ID = 'virtual:compodium:meta'
const RESOLVED_META_MODULE_ID = `\0${META_MODULE_ID}`
const META_BROWSER_ALIAS = '/__compodium__/modules/meta'

function getModuleSearchParams(id: string): URLSearchParams | undefined {
  const queryIndex = id.indexOf('?')
  const moduleId = queryIndex === -1 ? id : id.slice(0, queryIndex)
  if (moduleId !== META_MODULE_ID && moduleId !== META_BROWSER_ALIAS) return

  return new URLSearchParams(queryIndex === -1 ? '' : id.slice(queryIndex + 1))
}

function getResolvedMetadataPaths(id: string): { componentPath: string, macroPath: string } | undefined {
  if (!id.startsWith(`${RESOLVED_META_MODULE_ID}?`)) return
  const searchParams = new URLSearchParams(id.slice(RESOLVED_META_MODULE_ID.length + 1))
  const componentPath = searchParams.get('component')
  const macroPath = searchParams.get('macro')
  if (!componentPath || !macroPath) return
  return { componentPath, macroPath }
}

function hasTraversal(path: string): boolean {
  return path.split(/[\\/]/).includes('..')
}

function isPathInside(rootPath: string, filePath: string): boolean {
  const relativePath = relative(rootPath, filePath)
  return relativePath === '' || (!relativePath.startsWith('../') && relativePath !== '..' && !isAbsolute(relativePath))
}

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
  let checker: ReturnType<typeof createChecker>
  let configuredRootPaths: Promise<string[]>
  let metadataWatcher: ReturnType<typeof watch> | undefined
  let watcherClosePromise: Promise<void> | undefined
  const moduleIdsBySourcePath = new Map<string, Set<string>>()
  const resolvedModuleIds = new Set<string>()

  function closeMetadataWatcher(): Promise<void> {
    if (watcherClosePromise) return watcherClosePromise

    const watcher = metadataWatcher
    if (!watcher) return Promise.resolve()

    const closePromise = Promise.resolve()
      .then(() => watcher.close())
      .then(() => {
        if (metadataWatcher === watcher) metadataWatcher = undefined
      })
      .finally(() => {
        if (watcherClosePromise === closePromise) watcherClosePromise = undefined
      })

    watcherClosePromise = closePromise
    return closePromise
  }

  async function resolveAllowedComponentPath(requestedPath: string): Promise<string | undefined> {
    if (hasTraversal(requestedPath)) return

    const requestedRealPath = await realpath(requestedPath).catch(() => undefined)
    if (!requestedRealPath) return
    if ((await configuredRootPaths).some(root => isPathInside(root, requestedRealPath))) return requestedRealPath
  }

  async function loadMetadata(componentPath: string, macroPath: string): Promise<CompodiumMeta> {
    const checkerMeta = checker.getComponentMeta(componentPath)
    if (!checkerMeta) throw new Error(`Component metadata not found: ${componentPath}`)

    const compodium = await parseCompodiumMeta(macroPath)
    return {
      ...checkerMeta,
      ...(compodium ? { compodium } : {})
    }
  }

  return {
    name: 'compodium:meta',
    enforce: 'pre',
    apply: 'serve',

    configResolved(viteConfig) {
      rootDir = options.rootDir ?? viteConfig.root
      collections = resolveCollections(options, viteConfig)
      const roots = collections.flatMap(collection => [
        ...collection.dirs.map(dir => dir.path),
        collection.exampleDir.path
      ])
      configuredRootPaths = Promise.all(roots.map(path => realpath(path).catch(() => undefined)))
        .then(paths => paths.filter((path): path is string => Boolean(path)))
    },

    async resolveId(id) {
      const searchParams = getModuleSearchParams(id)
      if (!searchParams) return

      const componentPath = searchParams.get('component')
      if (!componentPath) throw new Error('Compodium metadata module requires a component path')
      const macroPath = searchParams.get('macro') ?? componentPath

      const canonicalComponentPath = await resolveAllowedComponentPath(componentPath)
      if (!canonicalComponentPath) throw new Error(`Unknown Compodium component path: ${componentPath}`)
      const canonicalMacroPath = await resolveAllowedComponentPath(macroPath)
      if (!canonicalMacroPath) throw new Error(`Unknown Compodium macro path: ${macroPath}`)

      const canonicalId = `${RESOLVED_META_MODULE_ID}?component=${encodeURIComponent(canonicalComponentPath)}&macro=${encodeURIComponent(canonicalMacroPath)}`
      for (const sourcePath of new Set([canonicalComponentPath, canonicalMacroPath])) {
        const moduleIds = moduleIdsBySourcePath.get(sourcePath) ?? new Set<string>()
        moduleIds.add(canonicalId)
        moduleIdsBySourcePath.set(sourcePath, moduleIds)
      }
      resolvedModuleIds.add(canonicalId)
      return canonicalId
    },

    async load(id) {
      const paths = getResolvedMetadataPaths(id)
      if (!paths || !resolvedModuleIds.has(id)) return

      const meta = await loadMetadata(paths.componentPath, paths.macroPath)
      return `export default ${JSON.stringify(meta)};`
    },

    configureServer(server) {
      const checkerDirs = collections.flatMap(c => [
        ...c.dirs,
        c.exampleDir
      ])
      checker = createChecker(checkerDirs, rootDir, options.tsconfigPath)

      const watchedPaths = collections.flatMap(collection => [
        ...collection.dirs,
        collection.exampleDir
      ]).map(d => d.path)

      // Watch for changes in example directory
      metadataWatcher = watch(watchedPaths, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      metadataWatcher.on('add', () => {
        checker.reload()
      })

      metadataWatcher.on('change', async (filePath: string) => {
        if (watchedPaths.find(p => filePath.startsWith(p))) {
          const code = await readFile(filePath, 'utf-8')
          checker.updateFile(filePath, code)

          const changedRealPath = await realpath(filePath).catch(() => filePath)
          for (const moduleId of moduleIdsBySourcePath.get(changedRealPath) ?? []) {
            const module = server.moduleGraph.getModuleById(moduleId)
            if (module) server.moduleGraph.invalidateModule(module)
          }

          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:changed' }
          })
        }
      })

      server.httpServer?.once('close', () => {
        closeMetadataWatcher().catch(error => server.config.logger.error('Failed to close Compodium metadata watcher', { error }))
      })
    },

    async closeBundle() {
      await closeMetadataWatcher()
    }
  }
}
