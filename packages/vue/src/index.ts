import type { PluginOptions } from '@compodium/core'
import { compodium as core } from '@compodium/core'
import { rendererPlugin } from './plugins/renderer'
import { vueDevtoolsPlugin } from './plugins/vueDevtools'
import { defu } from 'defu'

export const compodium = /* #__PURE__ */ (options: Partial<PluginOptions>) => {
  const opts = defu(options, {
    rootDir: process.cwd(),
    dir: './compodium'
  }) as PluginOptions

  opts.componentDirs ??= [
    { path: './src/components', pathPrefix: false }
  ]

  return [
    core(opts),
    rendererPlugin(opts),
    vueDevtoolsPlugin(opts)
  ]
}
