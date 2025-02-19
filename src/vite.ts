import type { ViteDevServer } from 'vite'
import { watch } from 'chokidar'
import type { ComponentsDir } from '@nuxt/schema'

export function compodiumVite({ dirs }: { dirs: (ComponentsDir | string)[] }) {
  return {
    name: 'compodium',
    configureServer(server: ViteDevServer) {
      const watcher = watch(dirs.map(d => typeof d === 'string' ? d : d.path), {
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

      watcher.on('add', path => sendEvent(path, 'compodium:component-added'))
      watcher.on('change', path => sendEvent(path, 'compodium:component-changed'))
      watcher.on('unlink', path => sendEvent(path, 'compodium:component-removed'))
    }
  }
}
