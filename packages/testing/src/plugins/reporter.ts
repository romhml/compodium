import type { WebSocketServer } from 'vite'
import type { TestCase } from 'vitest/node'
import { DefaultReporter } from 'vitest/reporters'
import type { CompodiumTestResult } from '../types'

export default class CompodiumReporter extends DefaultReporter {
  ws: WebSocketServer

  startTime?: number
  endTime?: number

  constructor(ws: WebSocketServer) {
    super()
    this.ws = ws
  }

  override onTestRunStart(): void {
    this.startTime = Date.now()
  }

  override onTestRunEnd(): void {
    this.endTime = Date.now()

    this.ws.send('compodium:test:finished', {
      took: this.startTime ? this.endTime - this.startTime : undefined
    })
    super.onTestRunEnd()
  }

  override onTestCaseResult(testCase: TestCase): void {
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
}
