import type { CompodiumTestMeta } from './types'

declare module 'vitest' {
  interface TaskMeta {
    compodium?: CompodiumTestMeta
  }
}
