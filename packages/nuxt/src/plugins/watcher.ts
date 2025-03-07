import type { ViteDevServer } from 'vite'
import type { PluginOptions } from '../unplugin'
import { watch } from 'chokidar'

export function WatcherPlugin(options: PluginOptions) {
  return {
    name: 'compodium:watcher',
    configureServer(server: ViteDevServer) {
      const watcher = watch(options.componentDirs.map(d => typeof d === 'string' ? d : d.path), {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      function sendEvent(path: string, event: string) {
        server.ws.send({
          type: 'custom',
          event: 'compodium:hmr',
          data: { path, event }
        })
      }

      watcher.on('add', path => sendEvent(path, 'component:added'))
      watcher.on('change', path => sendEvent(path, 'component:changed'))
      watcher.on('unlink', path => sendEvent(path, 'component:removed'))
    }
  }
}
