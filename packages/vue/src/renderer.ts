import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '@compodium/core'

export function rendererPlugin(_options: PluginOptions): VitePlugin {
  return {
    name: 'compodium:renderer',
    configureServer(server) {
      server.middlewares.use('/__compodium__/renderer', async (_req, res) => {
        try {
          // TODO: Should read the user's index.html and replace the body.
          const index = `<!DOCTYPE html>
            <html lang="">
              <head>
                <meta charset="UTF-8">
                <link rel="icon" href="/favicon.ico">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Vite App</title>
              </head>
              <body>
                <div id="compodium"></div>
                <script type="module" src="/@compodium/renderer.ts"></script>
              </body>
            </html>`
          res.setHeader('Content-Type', 'text/html')
          res.end(index)
        } catch {
          res.statusCode = 500
          res.end('Internal Server Error')
        }
      })
    },
    resolveId(id) {
      // Resolve the virtual module ID for the renderer script
      if (id === '/@compodium/renderer.ts') {
        return '\0renderer.ts'
      }
    },
    load(id) {
      // TODO: Create from user main.ts
      if (id === '\0renderer.ts') {
        return `
          import { createApp } from 'vue';
          import CompodiumRoot from '@compodium/core/runtime/root.vue';

          const app = createApp(CompodiumRoot);
          app.mount('#compodium');
        `
      }
    }
  }
}
