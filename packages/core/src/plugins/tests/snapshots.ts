import { basename } from 'pathe'
import { joinURL } from 'ufo'
import { inject } from 'vitest'
import { VitestSnapshotEnvironment } from 'vitest/snapshot'

declare module 'vitest' {
  interface ProvidedContext {
    root: string
  }
}

export class CompodiumSnapshotEnvironment extends VitestSnapshotEnvironment {
  async resolvePath(filePath: string): Promise<string> {
    const rootDir = inject('root')

    const path = await super.resolvePath(filePath)
    const filename = basename(path)

    return joinURL(rootDir, '__snapshots__/', filename)
  }
}

export default new CompodiumSnapshotEnvironment()
