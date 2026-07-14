import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '../types'

const COLORS_MODULE_ID = 'virtual:compodium:colors'
const RESOLVED_COLORS_MODULE_ID = `\0${COLORS_MODULE_ID}`
const COLORS_BROWSER_ALIAS = '/__compodium__/modules/colors'

/**
 * This plugin is responsible for getting the generated virtual templates and
 * making them available to the Vue build.
 */
export function colorsPlugin(options: PluginOptions): VitePlugin {
  function loadColors() {
    return options.extras?.colors
  }

  return {
    name: 'compodium:colors',
    apply: 'serve',

    resolveId(id) {
      const queryIndex = id.indexOf('?')
      const moduleId = queryIndex === -1 ? id : id.slice(0, queryIndex)
      if (moduleId !== COLORS_MODULE_ID && moduleId !== COLORS_BROWSER_ALIAS) return
      return RESOLVED_COLORS_MODULE_ID
    },

    load(id) {
      if (id !== RESOLVED_COLORS_MODULE_ID) return
      return `export default ${JSON.stringify(loadColors())};`
    }
  }
}
