import type { TestCase, TestSuite } from 'vitest/node'
import { DefaultReporter } from 'vitest/reporters'

export default class CompodiumReporter extends DefaultReporter {
  private results: any

  onTestCaseResult(testCase: TestCase): void {
    this.ctx.vite.ws.send('compodium:test:result', testCase)
  }

  onTestSuiteResult(testSuite: TestSuite): void {
    console.log('suite', testSuite.ok())
  }
}
