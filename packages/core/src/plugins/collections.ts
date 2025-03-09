import type { ViteDevServer } from 'vite'
import type { PluginOptions } from '../types'
import { scanComponents } from './utils'

export function collectionsPlugin(options: PluginOptions) {
  const dirs = options?.componentDirs.map((dir) => {
    const path = typeof dir === 'string' ? dir : dir.path
    return {
      ...typeof dir === 'string' ? {} : dir,
      path,
      name: 'Components',
      id: 'components',
      pattern: '**/*.{vue,ts,tsx}'
    }
  }).filter(collection => !collection.path?.includes('node_modules/'))

  const paths = dirs?.map(c => c.path)

  return {
    name: 'compodium:collections',

    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__compodium__/api/collections', async (req, res) => {
        const collections = [
          { name: 'Components', id: 'components', components: await scanComponents(dirs, options.rootDir) }
        ]

        res.setHeader('Content-Type', 'application/json')
        res.write(JSON.stringify(collections))
        res.end()
      })
    },

    handleHotUpdate({ server }: { server: ViteDevServer }) {
      server.watcher.on('add', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:added' }
          })
        }
      })

      server.watcher.on('addDir', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:added' }
          })
        }
      })

      server.watcher.on('unlink', async (filePath: string) => {
        if (paths.find(p => filePath.startsWith(p))) {
          server.ws.send({
            type: 'custom',
            event: 'compodium:hmr',
            data: { path: filePath, event: 'component:removed' }
          })
        }
      })
    }
  }
}
