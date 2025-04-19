import { basename } from 'pathe'
import { joinURL } from 'ufo'
import { VitestSnapshotEnvironment } from 'vitest/snapshot'

export class CompodiumSnapshotEnvironment extends VitestSnapshotEnvironment {
  async resolvePath(filePath: string): Promise<string> {
    const path = await super.resolvePath(filePath)
    const filename = basename(path)
    return joinURL('compodium/__snapshots__/', filename)
  }
}

export default new CompodiumSnapshotEnvironment()
