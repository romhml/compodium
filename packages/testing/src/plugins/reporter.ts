import type { WebSocketServer } from 'vite'
import type { TestCase, TestModule, TestSuite, TestRunEndReason } from 'vitest/node'
import type { Reporter } from 'vitest/reporters'
import type { CompodiumTestResult } from '../types'
import type { SerializedError } from 'vitest'

function resolveTestIds(testSuite: TestSuite): Array<string> {
  return [...testSuite.children.allTests().map(t => t.id), ...testSuite.children.allSuites().flatMap(resolveTestIds)]
}

export class CompodiumReporter implements Reporter {
  ws: WebSocketServer

  startTime?: number
  endTime?: number

  // Track suites by component name
  private pendingTestsByComponent: Record<string, Set<string>> = {}
  private stateByComponent: Record<string, string> = {}

  onTestModuleCollected(testModule: TestModule) {
    testModule.children.allSuites().forEach((s) => {
      this.pendingTestsByComponent[s.name] ??= new Set<string>()
      const tests = resolveTestIds(s)

      tests.forEach(id => this.pendingTestsByComponent[s.name]!.add(id))
      this.ws.send('compodium:test:suite', {
        name: s.name,
        tests
      })
    })
  }

  constructor(ws: WebSocketServer) {
    this.ws = ws
  }

  onTestRunStart(): void {
    this.startTime = Date.now()
    // Clear tracking data for new test run
    this.pendingTestsByComponent = {}
    this.stateByComponent = {}
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
      name: testCase.fullName,
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

    for (const component of Object.keys(this.pendingTestsByComponent)) {
      this.pendingTestsByComponent[component]?.delete(testCase.id)
    }

    this.ws.send('compodium:test:result', result)
  }

  /**
   * Called after the test suite and its hooks are finished running.
   * The `state` cannot be `pending`.
   */
  onTestSuiteResult(testSuite: TestSuite) {
    const state = this.stateByComponent[testSuite.name]
    if (!state || state === 'passed') this.stateByComponent[testSuite.name] = testSuite.state()

    if (!this.pendingTestsByComponent[testSuite.name]?.size) {
      this.ws.send('compodium:test:suite:result', {
        name: testSuite.name,
        state: this.stateByComponent[testSuite.name]
      })
    }
  }
}
