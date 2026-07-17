/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./virtual-modules.d.ts" preserve="true" />
/* eslint-enable @typescript-eslint/triple-slash-reference */

import { collectionsPlugin } from './plugins/collections'
import { extendMetaPlugin, metaPlugin } from './plugins/meta'
import { examplePlugin } from './plugins/examples'
import { devtoolsPlugin } from './plugins/devtools'
import { colorsPlugin } from './plugins/colors'
import { moduleProxyPlugin } from './plugins/module-proxy'
import type { PluginOptions } from './types'

export * from './types'

export const compodium = /* #__PURE__ */ (options: PluginOptions) => {
  return [
    moduleProxyPlugin(options),
    collectionsPlugin(options),
    metaPlugin(options),
    extendMetaPlugin(options),
    devtoolsPlugin(options),
    examplePlugin(options),
    colorsPlugin(options)
  ]
}
