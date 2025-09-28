import { createSharedComposable } from '@vueuse/core'
import { createClient, type VitestClient } from '@vitest/ws-client'
import { reactive, readonly } from 'vue'
import type { RunnerTask, RunnerTaskResult, TestError } from 'vitest'

let client: VitestClient

export interface TestState {
  id: string
  name?: string
  state: RunnerTaskResult['state']
  duration?: number
  errors?: TestError[]
}

export interface SuiteState {
  id: string
  name: string
  state: RunnerTaskResult['state']
  duration?: number
  errors?: TestError[]
  file?: string
  tests?: Map<string, TestState>
}

export function _useVitest() {
  const suites = reactive(new Map<string, SuiteState>())

  async function getVitest() {
    if (!client) {
      const { port, token } = await $fetch<{ port: number, token: string }>('/api/test/start', { baseURL: '/__compodium__' })

      client = createClient(`ws://${window.location.hostname}:${port}/__vitest_api__?token=${token}`, {
        handlers: {
          onTaskUpdate: (packs) => {
            packs.forEach(([id, result, meta]) => {
              updateTaskState({ id, result, meta })
            })
          },
          onCollected: (files) => {
            function processTask(task: RunnerTask) {
              updateTaskState(task)
              if ('tasks' in task) {
                task.tasks.forEach(t => processTask(t))
              }
            }
            files?.forEach(f => processTask(f))
          },
          onFinished: (files) => {
            console.log(`Test run finished (${files.length} files)`)
            const hasErrors = files.some(f => f.result?.state === 'fail')
            testStatus.value = hasErrors ? 'fail' : 'pass'
          }
        }
      })

      const connectedPromise = new Promise<void>((resolve) => {
        client.ws.addEventListener('open', () => resolve())
      })
      await connectedPromise
    }
    return client
  }

  function updateTaskState(task: Partial<RunnerTask> & { id: string }) {
    if (task.meta?.compodium?.suite) {
      const name = task.meta.compodium?.component ?? task.meta.compodium?.collection
      if (!name) return
      const suite = suites.get(name)
      suites.set(name, {
        ...suite,
        id: task.id,
        name,
        state: task.result?.state ?? 'queued',
        file: task.file?.filepath,
        duration: task.result?.duration,
        errors: task.result?.errors as TestError[]
      })
    } else if (task.meta?.compodium) {
      const componentName = task.meta?.compodium.component
      if (!componentName) return

      const suite = suites.get(componentName)
      if (!suite) return

      suite.tests ??= new Map()
      const test = suite.tests.get(task.id)

      suite.tests.set(task.id, {
        ...test,
        id: task.id,
        name: task.meta.compodium.name,
        state: task.result?.state ?? 'queued',
        duration: task.result?.duration,
        errors: task.result?.errors as TestError[]
      })
    }

    if (task.result?.errors) testErrors.value?.push(...task.result.errors as TestError[])
  }

  const testStatus = ref<RunnerTaskResult['state'] | null>(null)

  async function runTests() {
    testStatus.value = 'run'
    testErrors.value = []
    const vitest = await getVitest()
    const files = await vitest.rpc.getTestFiles().then(specs => specs.map(([_project, file, _config]) => file))

    for (const suite of suites.values()) {
      suite.state = 'run'
      suite.tests?.forEach(t => t.state = 'run')
    }

    await vitest.rpc.rerun(files, true)
  }

  async function runComponentTests(component: string) {
    const vitest = await getVitest()
    const suite = suites.get(component)
    if (!suite || !suite.file) return

    testStatus.value = 'run'
    testErrors.value = []

    suite.state = 'run'
    suite.tests?.forEach(t => t.state = 'run')

    await vitest.rpc.rerun([suite.file], true)
  }

  const testErrors = shallowRef<TestError[]>([])

  return {
    testStatus: readonly(testStatus),
    testErrors: testErrors,
    getVitest,
    runTests,
    runComponentTests,
    suites: readonly(suites)
  }
}

export const useVitest = createSharedComposable(_useVitest)
