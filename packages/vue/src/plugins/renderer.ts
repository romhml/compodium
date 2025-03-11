import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '@compodium/core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function rendererPlugin(options: PluginOptions): VitePlugin {
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
                <title>Compodium Renderer</title>
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
      if (id === '/@compodium/renderer.ts') {
        return '\0renderer.ts'
      }
    },
    load(id) {
      if (id === '\0renderer.ts') {
        // Read the user's main entrypoint file
        const mainPath = resolve(options.rootDir, 'src/main.ts')
        const mainContent: string = readFileSync(mainPath, 'utf-8').replace(
          /createApp\([^)]*\)/,
          'createApp(CompodiumRoot)'
        ).replace(
          /\.mount\([^)]*\)/,
          '.mount("#compodium")'
        ).replace(/'.\//g, '\'@/')

        return `import CompodiumRoot from '@compodium/core/runtime/root.vue';\n${mainContent}`
      }
    }
  }
}
