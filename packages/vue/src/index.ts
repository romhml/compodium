import type { PluginOptions } from '@compodium/core'
import { compodium as _compodium } from '@compodium/core'
import { rendererPlugin } from './renderer'

export const compodium = /* #__PURE__ */ (options: PluginOptions) => {
  return [
    _compodium(options),
    rendererPlugin(options)
  ]
}
