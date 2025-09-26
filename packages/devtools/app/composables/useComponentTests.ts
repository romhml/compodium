import type { Component, ComponentExample } from '@compodium/core'
import type { CompodiumTestResult } from '@compodium/testing'
import { createSharedComposable } from '@vueuse/core'
import type { TestState } from 'vitest/node'

function _useComponentTests() {
  const { onEvent } = useViteClient()

  const componentTestMap = ref<Record<number, Set<string>>>({})

  const testStatus: Ref<undefined | 'running' | 'passed' | 'failed' | 'interrupted'> = ref()
  const testResults = ref<Record<string, CompodiumTestResult[] | null>>({})

  const testStats = ref<{ took?: number } | undefined>()
  const testStates = ref<Record<string, TestState>>({})
  const partialTestRun = ref(false)

  const flatTestResults = computed(() => {
    const allResults = Object.values(testResults.value).flat()
    const seenIds = new Set()
    return allResults.filter((test) => {
      if (!test || seenIds.has(test.id)) return false
      seenIds.add(test.id)
      return true
    })
  })

  const testErrors = computed(
    () => flatTestResults.value.filter(t => !t?.ok)
  )

  onEvent('compodium:test:log', async (payload) => {
    console.log(...payload)
  })

  onEvent('compodium:test:start', async () => {
    testStatus.value = 'running'
  })

  onEvent('compodium:test:result', async (payload) => {
    const components = componentTestMap.value[payload.id]
    if (!components?.size) return

    components.forEach((component) => {
      testResults.value[component] ??= []
      testResults.value[component].push(payload)
    })
  })

  onEvent('compodium:test:finished', async (payload) => {
    testStats.value = payload
    testStatus.value = payload.reason
  })

  onEvent('compodium:test:suite', async (payload) => {
    payload.tests.forEach((id: number) => {
      componentTestMap.value[id] ??= new Set()
      componentTestMap.value[id].add(payload.name)
    })
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

    testErrors,

    watchMode,

    partialTestRun,

    async stopTests() {
      await $fetch('/api/stop-tests', { baseURL: '/__compodium__' })
    },

    async runTests(components?: (Component & Partial<ComponentExample>) | (Component & Partial<ComponentExample>)[], updateSnapshots?: boolean) {
      components = Array.isArray(components) ? components : components ? [components] : undefined

      componentTestMap.value = {}

      if (!components?.length) {
        partialTestRun.value = false
        testStates.value = {}
        testResults.value = {}
      } else {
        partialTestRun.value = true
        components.forEach((c) => {
          testResults.value[c.pascalName] = []
          testStates.value[c.pascalName] = 'pending'
          testStates.value[c.collectionName] = 'pending'
        })
      }

      await $fetch('/api/test', { baseURL: '/__compodium__', query: { component: components?.map(c => c.pascalName), update: updateSnapshots } })
    }
  }
}

export const useComponentTests = createSharedComposable(_useComponentTests)
