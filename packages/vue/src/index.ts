import type { CompodiumMeta, PluginOptions } from '@compodium/core'
import { compodium as core } from '@compodium/core'

import { rendererPlugin } from './plugins/renderer'
import { vueDevtoolsPlugin } from './plugins/vueDevtools'

import { defu } from 'defu'

export const compodium = /* #__PURE__ */ (opts?: Partial<Omit<PluginOptions, '_nuxt' | 'rootDir' | 'baseUrl'>>) => {
  const options = defu(opts, {
    dir: './compodium',
    includeLibraryCollections: true
  }) as PluginOptions

  options.componentDirs ??= [
    { path: './src/components', pathPrefix: false }
  ]

  return [
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
