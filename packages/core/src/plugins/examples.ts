import fs from 'node:fs/promises'
import type { VitePlugin } from 'unplugin'
import type { Collection, PluginOptions } from '../types'
import { isAbsolute, relative } from 'pathe'
import { resolveCollections } from './collections'
import { scanComponents } from './utils'

const EXAMPLE_MODULE_ID = 'virtual:compodium:example'
const RESOLVED_EXAMPLE_MODULE_ID = `\0${EXAMPLE_MODULE_ID}`
const EXAMPLE_BROWSER_ALIAS = '/__compodium__/modules/example'

function getModuleSearchParams(id: string): URLSearchParams | undefined {
  const queryIndex = id.indexOf('?')
  const moduleId = queryIndex === -1 ? id : id.slice(0, queryIndex)
  if (moduleId !== EXAMPLE_MODULE_ID && moduleId !== EXAMPLE_BROWSER_ALIAS) return

  return new URLSearchParams(queryIndex === -1 ? '' : id.slice(queryIndex + 1))
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
  let collections: Collection[]
  const moduleIdsByExamplePath = new Map<string, Set<string>>()
  const resolvedModuleIds = new Set<string>()
  let discoveredExamplePaths: Set<string> | undefined
  let discoveryPromise: Promise<Set<string>> | undefined
  let discoveryGeneration = 0

  function clearDiscoveredExamplePaths() {
    discoveryGeneration++
    discoveredExamplePaths = undefined
    discoveryPromise = undefined
  }

  async function getDiscoveredExamplePaths(): Promise<Set<string>> {
    if (discoveredExamplePaths) return discoveredExamplePaths
    if (discoveryPromise) return await discoveryPromise

    const generation = discoveryGeneration
    const populatePromise = (async () => {
      const realRoots = (await Promise.all(collections.map(collection => fs.realpath(collection.exampleDir.path).catch(() => undefined))))
        .filter((path): path is string => Boolean(path))
      const discoveredExamples = (await Promise.all(collections.map(collection => scanComponents([collection.exampleDir])))).flat()

      return new Set(discoveredExamples
        .map(example => example.realPath)
        .filter(path => realRoots.some(root => isPathInside(root, path))))
    })()

    discoveryPromise = populatePromise
    try {
      const paths = await populatePromise
      if (generation !== discoveryGeneration) return await getDiscoveredExamplePaths()
      discoveredExamplePaths = paths
      return paths
    } finally {
      if (discoveryPromise === populatePromise) discoveryPromise = undefined
    }
  }

  async function resolveDiscoveredExamplePath(requestedPath: string): Promise<string | undefined> {
    if (hasTraversal(requestedPath)) return

    const requestedRealPath = await fs.realpath(requestedPath).catch(() => undefined)
    if (!requestedRealPath) return
    if ((await getDiscoveredExamplePaths()).has(requestedRealPath)) return requestedRealPath
  }

  async function loadExampleSource(examplePath: string): Promise<string> {
    const exampleCode = await fs.readFile(examplePath)
    let result = exampleCode.toString()
      .replace(/extendCompodiumMeta\s*\([\s\S]*?\)\s*;?/g, '')

    if (options._nuxt) {
      result = result
        .replace(/import .* from 'vue'/, '')
    }

    return result.replace(/<script[^>]*>\s*<\/script>/g, '')
  }

  return {
    name: 'compodium:examples',
    apply: 'serve',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
    },

    async resolveId(id) {
      const searchParams = getModuleSearchParams(id)
      if (!searchParams) return

      const examplePath = searchParams.get('path')
      if (!examplePath) throw new Error('Compodium example module requires an example path')

      const discoveredPath = await resolveDiscoveredExamplePath(examplePath)
      if (!discoveredPath) throw new Error(`Unknown Compodium example path: ${examplePath}`)

      const canonicalId = `${RESOLVED_EXAMPLE_MODULE_ID}?path=${encodeURIComponent(discoveredPath)}`
      const moduleIds = moduleIdsByExamplePath.get(discoveredPath) ?? new Set<string>()
      moduleIds.add(canonicalId)
      moduleIdsByExamplePath.set(discoveredPath, moduleIds)
      resolvedModuleIds.add(canonicalId)
      return canonicalId
    },

    async load(id) {
      const examplePath = getResolvedExamplePath(id)
      if (!examplePath || !resolvedModuleIds.has(id)) return

      const source = await loadExampleSource(examplePath)
      return `export default ${JSON.stringify(source)};`
    },

    configureServer(server) {
      const exampleRoots = collections.map(collection => collection.exampleDir.path)
      const handleStructuralChange = (path: string) => {
        if (exampleRoots.some(root => isPathInside(root, path))) clearDiscoveredExamplePaths()
      }

      server.watcher.on('add', handleStructuralChange)
      server.watcher.on('addDir', handleStructuralChange)
      server.watcher.on('unlink', handleStructuralChange)
      server.watcher.on('unlinkDir', handleStructuralChange)
    },

    async handleHotUpdate({ file, server }) {
      const changedRealPath = await fs.realpath(file).catch(() => file)
      for (const moduleId of moduleIdsByExamplePath.get(changedRealPath) ?? []) {
        const module = server.moduleGraph.getModuleById(moduleId)
        if (module) server.moduleGraph.invalidateModule(module)
      }
    },

    closeBundle() {
      clearDiscoveredExamplePaths()
    }
  }
}
