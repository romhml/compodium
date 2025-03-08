import { readFile } from 'node:fs/promises'
import type { PluginOptions } from '../../unplugin'
import { createChecker } from './checker'

const META_PREFIX = /\0?\/compodium\/meta(.*)/

function isComponentMeta(id: string) {
  return META_PREFIX.test(id)
}

export async function metaPlugin(options: PluginOptions) {
  const checker = createChecker(options.componentDirs)
  const paths = options.componentDirs?.map(d => d.path)

  return {
    name: 'compodium:meta',
    async watchChange(param, { event }) {
      if (event === 'update' && paths.find(d => param.startsWith(d))) {
        const code = await readFile(param, 'utf-8')
        checker.updateFile(param, code)
        // TODO: Invalidate meta import
      }
    },
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
    }
  }
}
