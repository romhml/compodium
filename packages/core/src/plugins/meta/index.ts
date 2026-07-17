import { readFile, realpath } from 'node:fs/promises'
import type { Collection, CompodiumMeta, PluginOptions } from '../../types'
import { createChecker } from './checker'
import type { VitePlugin } from 'unplugin'
import type { ViteDevServer } from 'vite'

import AST from 'unplugin-ast/vite'
import { RESOLVED_COLLECTIONS_MODULE_ID, resolveCollections } from '../collections'
import { canonicalizeConfiguredRoot, isPathInside, resolvePathWithinRoots } from '../utils'
import { parseCompodiumMeta } from './compodium-meta'

export const META_MODULE_ID = 'virtual:compodium:meta'
const RESOLVED_META_MODULE_ID = `\0${META_MODULE_ID}`

function getModuleSearchParams(id: string): URLSearchParams | undefined {
  const queryIndex = id.indexOf('?')
  const moduleId = queryIndex === -1 ? id : id.slice(0, queryIndex)
  if (moduleId !== META_MODULE_ID) return

  const query = queryIndex === -1 ? '' : id.slice(queryIndex + 1)
  const searchParams = new URLSearchParams(query)
  if ([...searchParams.keys()].some(key => !['component', 'macro', 't'].includes(key))) {
    throw new Error(`Unsupported Compodium metadata module query: ?${query}`)
  }
  if (searchParams.getAll('component').length > 1 || searchParams.getAll('macro').length > 1 || searchParams.getAll('t').length > 1) {
    throw new Error(`Duplicate Compodium metadata module query key: ?${query}`)
  }
  const timestamp = searchParams.get('t')
  if (timestamp !== null && !/^\d{13}$/.test(timestamp)) throw new Error(`Invalid Compodium metadata module timestamp: ${timestamp}`)
  return searchParams
}

function getResolvedMetadataPaths(id: string): { componentPath: string, macroPath: string } | undefined {
  if (!id.startsWith(`${RESOLVED_META_MODULE_ID}?`)) return
  const searchParams = new URLSearchParams(id.slice(RESOLVED_META_MODULE_ID.length + 1))
  const componentPath = searchParams.get('component')
  const macroPath = searchParams.get('macro')
  if (!componentPath || !macroPath) return
  return { componentPath, macroPath }
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
  let configuredRoots: string[] = []
  const resolvedModuleIds = new Set<string>()

  function getMetadataModuleIdsForSource(sourcePath: string, server: ViteDevServer, directory = false): string[] {
    const knownModuleIds = new Set([...resolvedModuleIds, ...server.moduleGraph.idToModuleMap.keys()])
    return [...knownModuleIds].filter((moduleId) => {
      const paths = getResolvedMetadataPaths(moduleId)
      if (!paths) return false
      return [paths.componentPath, paths.macroPath]
        .some(path => path === sourcePath || (directory && isPathInside(sourcePath, path)))
    })
  }

  function removeMetadataRegistrations(filePath: string, directory: boolean, server: ViteDevServer) {
    for (const moduleId of getMetadataModuleIdsForSource(filePath, server, directory)) {
      const module = server.moduleGraph.getModuleById(moduleId)
      if (module) server.moduleGraph.invalidateModule(module)
      resolvedModuleIds.delete(moduleId)
    }
  }

  function invalidateCollectionsModule(server: ViteDevServer) {
    const module = server.moduleGraph.getModuleById(RESOLVED_COLLECTIONS_MODULE_ID)
    if (module) server.moduleGraph.invalidateModule(module)
  }

  async function loadMetadata(componentPath: string, macroPath: string): Promise<CompodiumMeta> {
    const checkerMeta = checker.getComponentMeta(componentPath)
    if (!checkerMeta) throw new Error(`Component metadata not found: ${componentPath}`)

    let compodium = await parseCompodiumMeta(macroPath)
    if (!compodium && macroPath !== componentPath) compodium = await parseCompodiumMeta(componentPath)
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
      configuredRoots = collections.flatMap(collection => [
        ...collection.dirs.map(dir => dir.path),
        ...collection.exampleDirs.map(dir => dir.path)
      ])
    },

    async resolveId(id) {
      const searchParams = getModuleSearchParams(id)
      if (!searchParams) return

      const componentPath = searchParams.get('component')
      if (!componentPath) throw new Error('Compodium metadata module requires a component path')
      const macroPath = searchParams.get('macro') ?? componentPath

      const canonicalRoots = await Promise.all(configuredRoots.map(canonicalizeConfiguredRoot))
      const canonicalComponentPath = await resolvePathWithinRoots(componentPath, canonicalRoots)
      if (!canonicalComponentPath) throw new Error(`Unknown Compodium component path: ${componentPath}`)
      const canonicalMacroPath = await resolvePathWithinRoots(macroPath, canonicalRoots)
      if (!canonicalMacroPath) throw new Error(`Unknown Compodium macro path: ${macroPath}`)

      const canonicalId = `${RESOLVED_META_MODULE_ID}?component=${encodeURIComponent(canonicalComponentPath)}&macro=${encodeURIComponent(canonicalMacroPath)}`
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
        ...c.exampleDirs
      ])
      checker = createChecker(checkerDirs, rootDir, options.tsconfigPath)

      server.watcher.add(configuredRoots)
      const isWatchedPath = (filePath: string) => configuredRoots.some(root => isPathInside(root, filePath))
      const handleAdd = (filePath: string) => {
        if (!isWatchedPath(filePath)) return
        invalidateCollectionsModule(server)
        checker.reload()
      }
      const handleRemove = (directory: boolean) => (filePath: string) => {
        if (!isWatchedPath(filePath)) return
        invalidateCollectionsModule(server)
        checker.reload()
        removeMetadataRegistrations(filePath, directory, server)
      }
      const handleUnlink = handleRemove(false)
      const handleUnlinkDir = handleRemove(true)

      server.watcher.on('add', handleAdd)
      server.watcher.on('addDir', handleAdd)
      server.watcher.on('unlink', handleUnlink)
      server.watcher.on('unlinkDir', handleUnlinkDir)
    },

    async handleHotUpdate({ file, server }) {
      if (!configuredRoots.some(root => isPathInside(root, file))) return

      const code = await readFile(file, 'utf-8')
      checker.updateFile(file, code)
      invalidateCollectionsModule(server)
      const changedRealPath = await realpath(file).catch(() => file)
      for (const moduleId of getMetadataModuleIdsForSource(changedRealPath, server)) {
        const module = server.moduleGraph.getModuleById(moduleId)
        if (module) server.moduleGraph.invalidateModule(module)
      }
    }
  }
}
