import type { VitePlugin } from 'unplugin'
import type { PluginConfig } from '@compodium/core'
import { colors } from 'consola/utils'
import { version } from '../../package.json'
import { joinURL } from 'ufo'

export function vueDevtoolsPlugin(config: PluginConfig): VitePlugin {
  return {
    name: 'compodium:devtools:vue',
    configureServer(server) {
      const _printUrls = server.printUrls

      server.printUrls = () => {
        const urls = server.resolvedUrls!
        _printUrls()
        for (const url of urls.local) {
          const compodiumUrl = url.endsWith('/') ? `${url}__compodium__/devtools/` : `${url}/__compodium__/devtools/`

          console.log([
            colors.magenta(`  ➜  `),
            colors.bold(colors.white(`Compodium:`)),
            colors.dim(` available in`),
            colors.white(` DevTools`),
            colors.dim(` or `),
            colors.cyan(`${compodiumUrl}`),
            colors.gray(` (v${version})`)
          ].join(''))
        }
      }
    },
    resolveId(id) {
      if (id === 'virtual:compodium:devtools') {
        return '\0virtual:compodium:devtools'
      }
    },
    load(id) {
      if (id === '\0virtual:compodium:devtools') {
        return `
          import { addCustomTab } from '${import.meta.resolve('@vue/devtools-kit')}'
          addCustomTab({
            name: 'compodium',
            title: 'Compodium',
            icon: '/__compodium__/devtools/favicon.svg',
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
              src: joinURL(config.baseUrl, `/@id/virtual:compodium:devtools`)
            }
          }
        ]
      }
    }
  }
}
