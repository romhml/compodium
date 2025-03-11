import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '@compodium/core'

export function vueDevtoolsPlugin(_options: PluginOptions): VitePlugin {
  return {
    name: 'compodium:devtools:vue',
    resolveId(id) {
      if (id === 'virtual:compodium:devtools') {
        return '\0virtual:compodium:devtools'
      }
    },
    load(id) {
      if (id === '\0virtual:compodium:devtools') {
        return `
          import { addCustomTab } from '@vue/devtools-kit'
          addCustomTab({
            name: 'compodium',
            title: 'Compodium',
            icon: 'baseline-collections-bookmark',
            view: {
              type: 'iframe',
              src: '/__compodium__/devtools'
            },
            category: 'modules'
          })
        `
      }
    },
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            injectTo: 'head-prepend' as const,
            attrs: {
              type: 'module',
              src: `@id/virtual:compodium:devtools`
            }
          }
        ]
      }
    }
  }
}
