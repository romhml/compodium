import type { PluginOptions } from '@compodium/core'
import { compodium as core } from '@compodium/core'
import { rendererPlugin } from './plugins/renderer'
import { vueDevtoolsPlugin } from './plugins/vueDevtools'
import { defu } from 'defu'
import { libraryCollections } from '@compodium/examples'
import { existsSync } from 'node:fs'
import { resolve } from 'pathe'

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

  return [
    core(options),
    rendererPlugin(options),
    vueDevtoolsPlugin(options)
  ]
}
