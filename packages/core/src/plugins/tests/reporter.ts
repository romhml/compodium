import type { WebSocketServer } from 'vite'
import type { TestCase } from 'vitest/node'
import { DefaultReporter } from 'vitest/reporters'
import type { CompodiumTestResult } from '../../types'

export default class CompodiumReporter extends DefaultReporter {
  ws: WebSocketServer

  constructor(ws: WebSocketServer) {
    super()
    this.ws = ws
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

    this.ws.send('compodium:test:result', result)
  }
}
