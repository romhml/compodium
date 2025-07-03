import type { CompodiumTestResult } from '@compodium/core'
import { createSharedComposable, useStorage } from '@vueuse/core'

function _useCompodiumTests() {
  const { hooks } = useCompodiumClient()

  const testResults = useStorage<Record<string, CompodiumTestResult | null>>('compodium-tests', () => ({}))

  hooks.hook('test:result', async (payload) => {
    testResults.value[payload.name] = payload
  })

  const testsRunning = ref(false)

  return {
    testResults,
    testsRunning,

    async acceptChanges(component: string) {
      await $fetch('/api/accept-changes', { method: 'PUT', query: { component } })
    },

    async runTests(component?: string) {
      if (!component) testResults.value = {}
      else testResults.value[component] = null

      testsRunning.value = true
      try {
        await $fetch('/api/test', { query: { component: component } })
      } finally {
        testsRunning.value = false
      }
    }
  }
}

export const useCompodiumTests = createSharedComposable(_useCompodiumTests)
