import type { PluginOptions } from '../unplugin'
import { scanComponents } from '../utils'

export async function collectionsPlugin(options: PluginOptions) {
  const virtualModuleId = 'virtual:compodium:collections'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

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

  const collections = [
    {
      name: 'Components',
      id: 'components',
      components: await scanComponents(dirs, options.rootDir)
    }
  ]

  return {
    name: 'compodium:templates',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return `export default ${JSON.stringify(collections)}`
      }
    }
  }
}
