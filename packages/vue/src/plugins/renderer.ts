import type { VitePlugin } from 'unplugin'
import type { PluginConfig } from '@compodium/core'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { joinURL } from 'ufo'
import { resolvePathSync } from 'mlly'

export function inferMainPath(indexContent: string) {
  // Find all script tags
  const scriptTags = indexContent.match(/<script[^>]*>/gi) || []
  for (const tag of scriptTags) {
    // Extract src attribute
    const srcMatch = tag.match(/src=["']([^"']+)["']/i)
    if (srcMatch && srcMatch[1]) {
      const path = srcMatch[1].replace(/^\//, './')
      if (path.startsWith('http://') || path.startsWith('https://')) continue
      return path
    }
  }
}

export function rendererPlugin(config: PluginConfig): VitePlugin {
  const indexPath = resolve(config.rootDir, 'index.html')
  const index = readFileSync(indexPath, 'utf-8')

  const inferredMainPath = inferMainPath(index)
  const mainPath = resolve(config.rootDir, (config.mainPath ?? inferredMainPath) as string)
  if (!config.mainPath && !inferredMainPath) {
    throw new Error('[Compodium] Could not infer main script path. Use the mainPath option to specify the path to your Vue script file containing createApp().')
  }

  return {
    name: 'compodium:renderer',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use('/__compodium__/renderer', async (_req, res) => {
        try {
          const rendererIndex = index.replace(
            /<body[^>]*>[\s\S]*<\/body>/i,
            `<body>
              <div id="compodium"></div>
              <script type="module" src="${joinURL(config.baseUrl, '/@compodium/renderer.ts')}"></script>
            </body>`
          )
          res.setHeader('Content-Type', 'text/html')
          res.end(rendererIndex)
        } catch {
          res.statusCode = 500
          res.end('Internal Server Error')
        }
      })
    },
    resolveId(id) {
      if (id === '/@compodium/renderer.ts') {
        return '\0@compodium/renderer.ts'
      }
    },
    load(id) {
      if (id === '\0@compodium/renderer.ts') {
        // Read the user's main entrypoint file

        if (!existsSync(mainPath)) {
          throw new Error(`[Compodium] failed to resolve main file ${mainPath}. Use the mainPath option to specify the path to your Vue script file containing createApp().`)
        }

        const mainDir = dirname(mainPath)
        const mainContent: string = readFileSync(mainPath, 'utf-8').replace(
          /createApp\([^)]*\)/,
          'createApp(CompodiumRoot)'
        ).replace(
          /\.mount\([^)]*\)/,
          '.mount("#compodium")'
        ).replace(/(from|import)\s+(['"])([./])/g, (_match, keyword, quote, path) => {
          // Resolve the relative import based on the main directory
          return `${keyword} ${quote}${resolve(mainDir, path)}/`
        })

        const rootVuePath = resolvePathSync('@compodium/core/runtime/root.vue', { extensions: ['.vue'], url: import.meta.url })
        return `import CompodiumRoot from '${rootVuePath}';\n${mainContent}`
      }
    }
  }
}
