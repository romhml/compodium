import { readFile } from 'node:fs/promises'
import type { PluginOptions } from '../../types'
import { createChecker } from './checker'
import type { ViteDevServer } from 'vite'

const META_PREFIX = /\0?\/compodium\/meta([^?]*)\?.*/

function isComponentMeta(id: string) {
  return META_PREFIX.test(id)
}

export function metaPlugin(options: PluginOptions) {
  const dirs = options?.componentDirs.map((dir) => {
    const path = typeof dir === 'string' ? dir : dir.path
    return {
      ...typeof dir === 'string' ? {} : dir,
      path,
      name: 'Components',
      id: 'components',
      pattern: '**/*.{vue,ts,tsx}'
    }
  })

  const checker = createChecker(dirs)
  const paths = dirs.map(d => d.path)

  return {
    name: 'compodium:meta',
    resolveId(id: string) {
      if (isComponentMeta(id)) {
        return '\0' + id
      }
      return null
    },

    async load(id: string) {
      const match = id.match(META_PREFIX)
      if (match) {
        const componentPath = match[1]
        const meta = checker.getComponentMeta(componentPath)
        return `export default ${JSON.stringify(meta)}`
      }
      return null
    },

    handleHotUpdate({ server }: { server: ViteDevServer }) {
      server.watcher.on('change', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
          const code = await readFile(filePath, 'utf-8')
          checker.updateFile(filePath, code)

          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:changed' }
          })
        }
      })
    }
  }
}
