import type { TestDiagnostic, TestResult } from 'vitest/node'
import type { TaskMeta } from 'vitest'

declare module 'vitest' {
  interface TaskMeta {
    compodium?: {
      diff?: boolean
      screenshotPath?: string
      diffPath?: string
      stagedScreenshotPath?: string
    }
  }
}

export type CompodiumTestResult = {
  name: string
  id: string
  ok: boolean
  result: TestResult
  diagnostic?: TestDiagnostic
  meta: TaskMeta
}
