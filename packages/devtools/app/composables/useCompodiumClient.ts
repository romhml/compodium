import type { CompodiumHooks } from '@compodium/core'
import type { CompodiumTestingHooks } from '@compodium/testing'
import { createHooks } from 'hookable'
import { createSharedComposable } from '@vueuse/core'

function _useCompodiumClient() {
  const hooks = createHooks<CompodiumHooks & CompodiumTestingHooks>()
  window.__COMPODIUM_HOOKS__ = hooks

  return {
    hooks
  }
}

export const useCompodiumClient = createSharedComposable(_useCompodiumClient)
