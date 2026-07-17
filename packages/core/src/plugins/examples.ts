import { readFile, realpath } from 'node:fs/promises'
import type { VitePlugin } from 'unplugin'
import type { ViteDevServer } from 'vite'
import type { PluginOptions } from '../types'
import { resolve } from 'pathe'
import { resolveCollections } from './collections'
import { canonicalizeConfiguredRoot, isPathInside, resolvePathWithinRoots } from './utils'

export const EXAMPLE_MODULE_ID = 'virtual:compodium:example'
const RESOLVED_EXAMPLE_MODULE_ID = `\0${EXAMPLE_MODULE_ID}`

function getModuleSearchParams(id: string): URLSearchParams | undefined {
  const queryIndex = id.indexOf('?')
  const moduleId = queryIndex === -1 ? id : id.slice(0, queryIndex)
  if (moduleId !== EXAMPLE_MODULE_ID) return

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

export function examplePlugin(options: PluginOptions): VitePlugin {
  const moduleIdsByExamplePath = new Map<string, Set<string>>()
  let exampleRoots: string[] = []

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
    },

    async resolveId(id) {
      const searchParams = getModuleSearchParams(id)
      if (!searchParams) return

      const examplePath = searchParams.get('path')
      if (!examplePath) throw new Error('Compodium example module requires an example path')

      const canonicalExampleRoots = await Promise.all(exampleRoots.map(canonicalizeConfiguredRoot))
      const requestedExamplePath = resolve(examplePath)
      const canonicalExamplePath = await resolvePathWithinRoots(examplePath, canonicalExampleRoots)
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
      server.watcher.add(exampleRoots)
      const handleUnlink = (path: string) => removeExampleRegistrations(path, false, server)
      const handleUnlinkDir = (path: string) => removeExampleRegistrations(path, true, server)

      server.watcher.on('unlink', handleUnlink)
      server.watcher.on('unlinkDir', handleUnlinkDir)
    },

    async handleHotUpdate({ file, server }) {
      const changedRealPath = await realpath(file).catch(() => file)
      for (const moduleId of moduleIdsByExamplePath.get(changedRealPath) ?? []) {
        const module = server.moduleGraph.getModuleById(moduleId)
        if (module) server.moduleGraph.invalidateModule(module)
      }
    }
  }
}
