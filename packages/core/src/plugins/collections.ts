import type { PluginOptions } from '../types'
import { scanComponents } from './utils'

export function collectionsPlugin(options: PluginOptions): Unplugin {
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

  return {
    name: 'compodium:templates',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const collections = [
          {
            name: 'Components',
            id: 'components',
            components: await scanComponents(dirs, options.rootDir)
          }
        ]
        return `export default ${JSON.stringify(collections)}`
      }
    }
  }
}
