import type { WebSocketServer } from 'vite'
import type { TestCase, TestModule, TestSuite, TestRunEndReason, ReportedHookContext } from 'vitest/node'
import type { Reporter } from 'vitest/reporters'
import type { CompodiumTestResult } from '../types'
import type { SerializedError } from 'vitest'

declare module 'vitest' {
  interface TaskMeta {
    compodium?: {
      name?: string
      diff?: boolean
    }
  }
}

export class CompodiumReporter implements Reporter {
  ws: WebSocketServer

  startTime?: number
  endTime?: number

  constructor(ws: WebSocketServer) {
    this.ws = ws
  }

  onTestRunStart(): void {
    this.startTime = Date.now()
    this.ws.send('compodium:test:start')
  }

  onTestRunEnd(_testModules: ReadonlyArray<TestModule>, errors: ReadonlyArray<SerializedError>, reason: TestRunEndReason) {
    this.endTime = Date.now()

    this.ws.send('compodium:test:finished', {
      took: this.startTime ? this.endTime - this.startTime : undefined,
      errors,
      reason
    })
  }

  onTestCaseReady(testCase: TestCase): void {
    const result: CompodiumTestResult = {
      name: testCase.name,
      id: testCase.id,
      ok: testCase.ok(),
      result: testCase.result(),
      diagnostic: testCase.diagnostic(),
      meta: testCase.meta()
    }

    this.ws.send('compodium:test:ready', result)
  }

  onTestCaseResult(testCase: TestCase): void {
    const result: CompodiumTestResult = {
      name: testCase.name,
      id: testCase.id,
      ok: testCase.ok(),
      result: testCase.result(),
      diagnostic: testCase.diagnostic(),
      meta: testCase.meta()
    }

    if (result.result.state === 'skipped') return

    this.ws.send('compodium:test:result', result)
  }

  onHookEnd(context: ReportedHookContext) {
    if (context.entity.type !== 'suite') return

    const meta = context.entity.meta()?.compodium
    const name = meta?.name

    if (name) this.ws.send('compodium:test:suite:start', { name, state: 'pending' })
  }

  /**
   * Called after the test suite and its hooks are finished running.
   * The `state` cannot be `pending`.
   */
  onTestSuiteResult(testSuite: TestSuite) {
    const meta = testSuite.meta()?.compodium
    const name = meta?.name
    if (!name) return

    this.ws.send('compodium:test:suite:result', {
      name,
      ok: testSuite.ok(),
      state: testSuite.state()
    })
  }
}
