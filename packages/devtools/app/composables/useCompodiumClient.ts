import type { CompodiumHooks } from 'compodium/types'
import { createHooks } from 'hookable'
import { createSharedComposable } from '@vueuse/core'

function _useCompodiumClient() {
  const hooks = createHooks<CompodiumHooks>()
  window.__COMPODIUM_HOOKS__ = hooks

  return {
    hooks
  }
}

export const useCompodiumClient = createSharedComposable(_useCompodiumClient)
