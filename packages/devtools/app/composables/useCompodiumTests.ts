import type { CompodiumTestResult } from '@compodium/core'
import { createSharedComposable } from '@vueuse/core'

function _useCompodiumTests() {
  const { hooks } = useCompodiumClient()

  const testStatus: Ref<undefined | 'running' | 'passed' | 'failed'> = ref()
  const testResults = useState<Record<string, CompodiumTestResult | null>>('compodium-tests', () => ({}))
  const testStats = ref<{ took?: number } | undefined>()

  hooks.hook('test:result', async (payload) => {
    const component = payload.meta.compodium?.component
    if (!component) return
    testResults.value[component] = payload
  })

  hooks.hook('test:finished', async (payload) => {
    testStats.value = payload
  })

  const watchMode = ref(true)

  return {
    testStatus,
    testResults,
    testStats,

    watchMode,

    async acceptChanges(component: string) {
      await $fetch('/api/accept-changes', { method: 'PUT', query: { component } })
    },

    async runTests(components?: string | string[]) {
      testStatus.value = 'running'

      components = Array.isArray(components) ? components : components ? [components] : undefined

      if (!components) testResults.value = {}
      else components.forEach(c => testResults.value[c] = null)

      try {
        await $fetch('/api/test', { query: { component: components } })
      } finally {
        testStatus.value = Object.values(testResults.value).some(r => !!r && !r?.ok) ? 'failed' as const : 'passed' as const
      }
    }
  }
}

export const useCompodiumTests = createSharedComposable(_useCompodiumTests)
