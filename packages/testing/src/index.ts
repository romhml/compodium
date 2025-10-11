import type { PluginOptions } from '@compodium/core'
import { testPlugin } from './plugins/vitest'

export * from './types'

export const compodiumTesting = /* #__PURE__ */ (options: PluginOptions) => {
  return [
    testPlugin(options)
  ]
}
