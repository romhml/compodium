import { createUnplugin } from 'unplugin'
import { collectionsPlugin } from './plugins/collections'
import { metaPlugin } from './plugins/meta'
import type { PluginOptions } from './types'

export const compodium = /* #__PURE__ */ createUnplugin<PluginOptions>((options) => {
  return [
    collectionsPlugin(options),
    metaPlugin(options)
  ]
})
