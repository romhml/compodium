import type { Component, ComponentExample } from '@compodium/core'
import type { CompodiumTestResult } from '@compodium/testing'
import { createSharedComposable } from '@vueuse/core'
import type { TestState } from 'vitest/node'

function _useCompodiumTests() {
  const { onEvent } = useViteClient()

  const testStatus: Ref<undefined | 'running' | 'passed' | 'failed' | 'interrupted'> = ref()
  const testResults = useState<Record<string, CompodiumTestResult | null>>('compodium-tests', () => ({}))

  const testStats = ref<{ took?: number } | undefined>()
  const testStates = ref<Record<string, TestState>>({})
  const partialTestRun = ref(false)

  const visualChanges = computed(() => Object.values(testResults.value).filter(t => t?.meta?.compodium.diff)?.length)

  onEvent('compodium:test:log', async (payload) => {
    console.log(...payload)
  })

  onEvent('compodium:test:start', async () => {
    testStatus.value = 'running'
  })

  onEvent('compodium:test:result', async (payload) => {
    const component = payload.meta.compodium?.name
    if (!component) return

    testStates.value[component] = payload.result.state
    testResults.value[component] = payload
  })

  onEvent('compodium:test:finished', async (payload) => {
    testStats.value = payload
    testStatus.value = payload.reason
  })

  onEvent('compodium:test:suite:start', async (payload) => {
    if (!payload.name) return
    testStates.value[payload.name] = payload.state
  })

  onEvent('compodium:test:suite:result', async (payload) => {
    if (!payload.name) return
    testStates.value[payload.name] = payload.state
  })

  const watchMode = ref(true)

  return {
    testStatus,
    testResults,
    testStats,
    testStates,
    visualChanges,

    watchMode,

    partialTestRun,

    async stopTests() {
      await $fetch('/api/stop-tests')
    },

    async runTests(components?: (Component & Partial<ComponentExample>) | (Component & Partial<ComponentExample>)[], updateSnapshots?: boolean) {
      components = Array.isArray(components) ? components : components ? [components] : undefined

      if (!components?.length) {
        partialTestRun.value = false
        testStates.value = {}
        testResults.value = {}
      } else {
        partialTestRun.value = true
        components.forEach((c) => {
          testStates.value[c.pascalName] = 'pending'
          testStates.value[c.collectionName] = 'pending'
          if (c.componentName) testStates.value[c.componentName] = 'pending'
        })
      }

      await $fetch('/api/test', { query: { component: components?.map(c => c.pascalName), update: updateSnapshots } })
    }
  }
}

export const useCompodiumTests = createSharedComposable(_useCompodiumTests)
