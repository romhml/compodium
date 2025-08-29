export * from './types'

import type { PluginOptions } from '@compodium/core'
import { testPlugin } from './plugins/vitest'

export const compodiumTesting = /* #__PURE__ */ (options: PluginOptions) => {
  return [
    testPlugin(options)
  ]
}
