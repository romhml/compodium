import 'vitest'

export interface CompodiumTestMeta {
  component?: string
  collection?: string
  suite?: boolean
  name?: string
}

declare module 'vitest' {
  interface TaskMeta {
    compodium?: CompodiumTestMeta
  }
}
