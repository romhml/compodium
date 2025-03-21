import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '@compodium/core'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export function rendererPlugin(options: PluginOptions): VitePlugin {
  return {
    name: 'compodium:renderer',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use('/__compodium__/renderer', async (_req, res) => {
        try {
          // TODO: Should read the user's index.html and replace the body.
          const indexPath = resolve(options.rootDir, 'index.html')
          let index = readFileSync(indexPath, 'utf-8')
          index = index.replace(
            /<body[^>]*>[\s\S]*<\/body>/i,
            `<body>
              <div id="compodium"></div>
              <script type="module" src="/@compodium/renderer.ts"></script>
            </body>`
          )
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
        const mainPath = resolve(options.rootDir, options.mainPath ?? 'src/main.ts')

        if (!existsSync(mainPath)) {
          throw new Error(`[Compodium] failed to resolve main file ${options.mainPath}.`)
        }

        const mainDir = dirname(mainPath)
        const mainContent: string = readFileSync(mainPath, 'utf-8').replace(
          /createApp\([^)]*\)/,
          'createApp(CompodiumRoot)'
        ).replace(
          /\.mount\([^)]*\)/,
          '.mount("#compodium")'
        ).replace(/(from|import)\s+(['"])([./])/g, (match, keyword, quote, path) => {
        // Resolve the relative import based on the main directory
          return `${keyword} ${quote}${resolve(mainDir, path)}/`
        })

        return `import CompodiumRoot from '${import.meta.resolve('@compodium/core/runtime/root.vue')}';\n${mainContent}`
      }
    }
  }
}
