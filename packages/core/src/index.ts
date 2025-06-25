import { collectionsPlugin } from './plugins/collections'
import { extendMetaPlugin, metaPlugin } from './plugins/meta'
import { examplePlugin } from './plugins/examples'
import { devtoolsPlugin } from './plugins/devtools'
import { colorsPlugin } from './plugins/colors'
import { iconifyPlugin } from './plugins/iconify'
import type { PluginOptions } from './types'

export * from './types'

export const compodium = /* #__PURE__ */ (options: PluginOptions) => {
  return [
    collectionsPlugin(options),
    metaPlugin(options),
    extendMetaPlugin(options),
    devtoolsPlugin(options),
    examplePlugin(options),
    iconifyPlugin(options),
    colorsPlugin(options)
  ]
}
