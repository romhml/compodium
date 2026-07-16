import { readFile, realpath } from 'node:fs/promises'
import type { VitePlugin } from 'unplugin'
import type { ViteDevServer } from 'vite'
import type { PluginOptions } from '../types'
import { basename, dirname, isAbsolute, relative, resolve } from 'pathe'
import { resolveCollections } from './collections'

const EXAMPLE_MODULE_ID = 'virtual:compodium:example'
const RESOLVED_EXAMPLE_MODULE_ID = `\0${EXAMPLE_MODULE_ID}`
const EXAMPLE_BROWSER_ALIAS = '/__compodium__/modules/example'

function getModuleSearchParams(id: string): URLSearchParams | undefined {
  const queryIndex = id.indexOf('?')
  const moduleId = queryIndex === -1 ? id : id.slice(0, queryIndex)
  if (moduleId !== EXAMPLE_MODULE_ID && moduleId !== EXAMPLE_BROWSER_ALIAS) return

  const query = queryIndex === -1 ? '' : id.slice(queryIndex + 1)
  const searchParams = new URLSearchParams(query)
  if ([...searchParams.keys()].some(key => !['path', 't'].includes(key))) {
    throw new Error(`Unsupported Compodium example module query: ?${query}`)
  }
  if (searchParams.getAll('path').length > 1 || searchParams.getAll('t').length > 1) {
    throw new Error(`Duplicate Compodium example module query key: ?${query}`)
  }
  const timestamp = searchParams.get('t')
  if (timestamp !== null && !/^\d{13}$/.test(timestamp)) throw new Error(`Invalid Compodium example module timestamp: ${timestamp}`)
  return searchParams
}

function getResolvedExamplePath(id: string): string | undefined {
  if (!id.startsWith(`${RESOLVED_EXAMPLE_MODULE_ID}?`)) return
  return new URLSearchParams(id.slice(RESOLVED_EXAMPLE_MODULE_ID.length + 1)).get('path') ?? undefined
}

function hasTraversal(path: string): boolean {
  return path.split(/[\\/]/).includes('..')
}

function isPathInside(rootPath: string, filePath: string): boolean {
  const relativePath = relative(rootPath, filePath)
  return relativePath === '' || (!relativePath.startsWith('../') && relativePath !== '..' && !isAbsolute(relativePath))
}

export function examplePlugin(options: PluginOptions): VitePlugin {
  const moduleIdsByExamplePath = new Map<string, Set<string>>()
  let exampleRoots: string[] = []
  let canonicalExampleRoots: Promise<string[]>
  let removeWatcherListeners: (() => void) | undefined

  async function canonicalizeConfiguredRoot(rootPath: string): Promise<string> {
    const missingSegments: string[] = []
    let ancestorPath = rootPath

    while (true) {
      const ancestorRealPath = await realpath(ancestorPath).catch(() => undefined)
      if (ancestorRealPath) return resolve(ancestorRealPath, ...missingSegments)

      const parentPath = dirname(ancestorPath)
      if (parentPath === ancestorPath) throw new Error(`Unable to canonicalize Compodium example root: ${rootPath}`)
      missingSegments.unshift(basename(ancestorPath))
      ancestorPath = parentPath
    }
  }

  function refreshCanonicalExampleRoots(): Promise<string[]> {
    canonicalExampleRoots = Promise.all(exampleRoots.map(canonicalizeConfiguredRoot))
    return canonicalExampleRoots
  }

  async function resolveAllowedExamplePath(requestedPath: string): Promise<string | undefined> {
    if (hasTraversal(requestedPath)) return

    const requestedRealPath = await realpath(requestedPath).catch(() => undefined)
    if (!requestedRealPath) return
    if ((await canonicalExampleRoots).some(root => isPathInside(root, requestedRealPath))) return requestedRealPath
  }

  async function loadExampleSource(examplePath: string): Promise<string> {
    const exampleCode = await readFile(examplePath)
    let result = exampleCode.toString()
      .replace(/extendCompodiumMeta\s*\([\s\S]*?\)\s*;?/g, '')

    if (options._nuxt) {
      result = result
        .replace(/import .* from 'vue'/, '')
    }

    return result.replace(/<script[^>]*>\s*<\/script>/g, '')
  }

  function getExampleModuleIdsForSource(sourcePath: string): string[] {
    return [...moduleIdsByExamplePath.get(sourcePath) ?? []]
  }

  function removeExampleRegistrations(filePath: string, directory: boolean, server: ViteDevServer) {
    const removedPath = resolve(filePath)
    const affectedModuleIds = new Set([...moduleIdsByExamplePath]
      .filter(([sourcePath]) => sourcePath === removedPath || (directory && isPathInside(removedPath, sourcePath)))
      .flatMap(([, moduleIds]) => [...moduleIds]))

    for (const moduleId of affectedModuleIds) {
      const module = server.moduleGraph.getModuleById(moduleId)
      if (module) server.moduleGraph.invalidateModule(module)

      for (const [sourcePath, moduleIds] of moduleIdsByExamplePath) {
        moduleIds.delete(moduleId)
        if (moduleIds.size === 0) moduleIdsByExamplePath.delete(sourcePath)
      }
    }
  }

  return {
    name: 'compodium:examples',
    apply: 'serve',

    configResolved(viteConfig) {
      exampleRoots = resolveCollections(options, viteConfig)
        .flatMap(collection => collection.exampleDirs.map(dir => dir.path))
      refreshCanonicalExampleRoots()
    },

    async resolveId(id) {
      const searchParams = getModuleSearchParams(id)
      if (!searchParams) return

      const examplePath = searchParams.get('path')
      if (!examplePath) throw new Error('Compodium example module requires an example path')

      await refreshCanonicalExampleRoots()
      const requestedExamplePath = resolve(examplePath)
      const canonicalExamplePath = await resolveAllowedExamplePath(examplePath)
      if (!canonicalExamplePath) throw new Error(`Unknown Compodium example path: ${examplePath}`)

      const canonicalId = `${RESOLVED_EXAMPLE_MODULE_ID}?path=${encodeURIComponent(canonicalExamplePath)}`
      for (const sourcePath of new Set([requestedExamplePath, canonicalExamplePath])) {
        const moduleIds = moduleIdsByExamplePath.get(sourcePath) ?? new Set<string>()
        moduleIds.add(canonicalId)
        moduleIdsByExamplePath.set(sourcePath, moduleIds)
      }
      return canonicalId
    },

    async load(id) {
      const examplePath = getResolvedExamplePath(id)
      if (!examplePath || !moduleIdsByExamplePath.get(examplePath)?.has(id)) return

      const source = await loadExampleSource(examplePath)
      return `export default ${JSON.stringify(source)};`
    },

    configureServer(server) {
      removeWatcherListeners?.()
      server.watcher.add(exampleRoots)
      const handleRemove = (directory: boolean) => (path: string) => {
        removeExampleRegistrations(path, directory, server)
      }
      const handleUnlink = handleRemove(false)
      const handleUnlinkDir = handleRemove(true)

      server.watcher.on('unlink', handleUnlink)
      server.watcher.on('unlinkDir', handleUnlinkDir)

      removeWatcherListeners = () => {
        server.watcher.off('unlink', handleUnlink)
        server.watcher.off('unlinkDir', handleUnlinkDir)
      }
      server.httpServer?.once('close', removeWatcherListeners)
    },

    async handleHotUpdate({ file, server }) {
      const changedRealPath = await realpath(file).catch(() => file)
      for (const moduleId of getExampleModuleIdsForSource(changedRealPath)) {
        const module = server.moduleGraph.getModuleById(moduleId)
        if (module) server.moduleGraph.invalidateModule(module)
      }
    },

    closeBundle() {
      removeWatcherListeners?.()
      removeWatcherListeners = undefined
    }
  }
}
