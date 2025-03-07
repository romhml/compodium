import type { ViteDevServer } from 'vite'
import { toNodeListener, createApp, createRouter } from 'h3'

import collectionHandler from './routes/collections'
import componentMetaHandler from './routes/component-meta'
import reloadMetaHandler from './routes/reload-meta'
import colorsHandler from './routes/colors'
import exampleHandler from './routes/example'
import iconifyHandler from './routes/iconify'
import type { PluginOptions } from '../../unplugin'

export function ApiPlugin(options: PluginOptions) {
  return {
    name: 'compodium:api',
    watch: {
      paths: ['./routes', './utils']
    },
    async configureServer(server: ViteDevServer) {
      return async () => {
        const app = createApp(options)
        const router = createRouter()

        router.get('/collections', collectionHandler)
        router.get('/component-meta/:component', componentMetaHandler)
        router.get('/reload-meta', reloadMetaHandler)
        router.get('/examples/:component', exampleHandler)
        router.get('/colors', colorsHandler)
        router.get('/iconify', iconifyHandler)

        app.use(router)
        server.middlewares.use('/__compodium__/api', toNodeListener(app))
      }
    }
  }
}
