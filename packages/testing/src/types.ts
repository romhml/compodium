import type { TestDiagnostic, TestResult } from 'vitest/node'
import type { TaskMeta } from 'vitest'

export type CompodiumTestResult = {
  name: string
  id: string
  ok: boolean
  result: TestResult
  diagnostic?: TestDiagnostic
  meta: TaskMeta
}
