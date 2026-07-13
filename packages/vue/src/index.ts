import type { CompodiumMeta, PluginOptions } from '@compodium/core'
import { compodium as core } from '@compodium/core'

import { rendererPlugin } from './plugins/renderer'
import { vueDevtoolsPlugin } from './plugins/vueDevtools'

import { defu } from 'defu'
import { existsSync } from 'node:fs'
import { resolve } from 'pathe'

function appTsconfigPlugin(options: PluginOptions) {
  return {
    name: 'compodium:vue-tsconfig',
    enforce: 'pre' as const,
    configResolved(viteConfig: { root: string }) {
      if (options.tsconfigPath) return

      const appTsconfigPath = resolve(options.rootDir ?? viteConfig.root, 'tsconfig.app.json')

      if (!existsSync(appTsconfigPath)) return

      options.tsconfigPath = appTsconfigPath
    }
  }
}

export const compodium = /* #__PURE__ */ (opts?: Partial<Omit<PluginOptions, '_nuxt' | 'rootDir' | 'baseUrl'>>) => {
  const options = defu(opts, {
    dir: './compodium',
    includeLibraryCollections: true
  }) as PluginOptions

  options.componentDirs ??= [
    { path: './src/components', pathPrefix: false }
  ]

  return [
    appTsconfigPlugin(options),
    core(options),
    rendererPlugin(options),
    vueDevtoolsPlugin(options)
  ]
}

declare global {
  /**
   * Macro to configure components and examples.
   */
  function extendCompodiumMeta<T = Record<string, any>>(_options: CompodiumMeta<T>['compodium']): void
}
