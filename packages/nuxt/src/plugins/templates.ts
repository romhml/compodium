import type { PluginOptions } from '../unplugin'

export function TemplatesPlugin(options: PluginOptions) {
  const virtualModuleId = 'virtual:compodium'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'compodium:templates',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return `export const compodium = ${JSON.stringify(options)}`
      }
    }
  }
}
