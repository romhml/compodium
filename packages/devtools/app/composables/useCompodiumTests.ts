import type { CompodiumTestResult } from '@compodium/core'
import { createSharedComposable, useStorage } from '@vueuse/core'

function _useCompodiumTests() {
  const { hooks } = useCompodiumClient()

  const testResults = useStorage<Record<string, CompodiumTestResult | null>>('compodium-tests', () => ({}))

  hooks.hook('test:result', async (payload) => {
    testResults.value[payload.name] = payload
  })

  const testsRunning = ref(false)
  const watchMode = ref(true)

  return {
    testResults,
    testsRunning,
    watchMode,

    async acceptChanges(component: string) {
      await $fetch('/api/accept-changes', { method: 'PUT', query: { component } })
    },

    async runTests(components?: string | string[]) {
      testsRunning.value = true

      components = Array.isArray(components) ? components : components ? [components] : undefined

      if (!components) testResults.value = {}
      else components.forEach(c => testResults.value[c] = null)

      try {
        await $fetch('/api/test', { query: { component: components } })
      } finally {
        testsRunning.value = false
      }
    }
  }
}

export const useCompodiumTests = createSharedComposable(_useCompodiumTests)
