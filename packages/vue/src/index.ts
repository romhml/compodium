import type { CompodiumMeta, PluginOptions } from '@compodium/core'
import { compodium as core, resolveConfig } from '@compodium/core'
import { rendererPlugin } from './plugins/renderer'
import { vueDevtoolsPlugin } from './plugins/vueDevtools'
import { defu } from 'defu'
import { libraryCollections } from '@compodium/examples'
import { existsSync } from 'node:fs'
import { resolve } from 'pathe'
import type { VitePlugin } from 'unplugin'

export const compodium = /* #__PURE__ */ (opts?: Partial<Omit<PluginOptions, '_nuxt' | 'rootDir'>>) => {
  const options = defu(opts, {
    rootDir: './',
    dir: './compodium',
    includeLibraryCollections: true,
    mainPath: 'src/main.ts'
  }) as PluginOptions

  options.componentDirs ??= [
    { path: './src/components', pathPrefix: false }
  ]

  if (options.includeLibraryCollections) {
    const collections = libraryCollections.filter((c: any) => existsSync(resolve(options.rootDir, `node_modules/${c.package}`)))
    options.componentDirs = options.componentDirs.concat(collections)
  }

  const config = resolveConfig(options)

  return [
    {
      configResolved(viteConfig) {
        config.baseUrl = viteConfig.base
      }
    } as VitePlugin,

    core(config),
    rendererPlugin(config),
    vueDevtoolsPlugin(config)
  ]
}

declare global {
  /**
   * Macro to configure components and examples.
   */
  function extendCompodiumMeta<T = Record<string, any>>(_options: CompodiumMeta<T>['compodium']): void
}
