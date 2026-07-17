import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '../types'

export const COLORS_MODULE_ID = 'virtual:compodium:colors'
const RESOLVED_COLORS_MODULE_ID = `\0${COLORS_MODULE_ID}`

/**
 * This plugin is responsible for getting the generated virtual templates and
 * making them available to the Vue build.
 */
export function colorsPlugin(options: PluginOptions): VitePlugin {
  return {
    name: 'compodium:colors',
    apply: 'serve',

    resolveId(id) {
      const queryIndex = id.indexOf('?')
      const moduleId = queryIndex === -1 ? id : id.slice(0, queryIndex)
      if (moduleId !== COLORS_MODULE_ID) return
      const query = queryIndex === -1 ? '' : id.slice(queryIndex + 1)
      const entries = [...new URLSearchParams(query)]
      if (entries.length > 1 || (entries.length === 1 && (entries[0]![0] !== 't' || !/^\d{13}$/.test(entries[0]![1])))) {
        throw new Error(`Unsupported Compodium colors module query: ?${query}`)
      }
      return RESOLVED_COLORS_MODULE_ID
    },

    load(id) {
      if (id !== RESOLVED_COLORS_MODULE_ID) return
      return `export default ${JSON.stringify(options.extras?.colors)};`
    }
  }
}
