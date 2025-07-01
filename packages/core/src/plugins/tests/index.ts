/// <reference types="vitest" />
import type { VitePlugin } from 'unplugin'
import { joinURL } from 'ufo'
import { resolvePathSync } from 'mlly'
import { type Vitest, createVitest } from 'vitest/node'

import type { PluginOptions } from '../../types'
import CompodiumReporter from './reporter'
import type { WebSocketServer } from 'vite'

export function testPlugin(options: PluginOptions): VitePlugin {
  let rootDir: string

  let vitest: Vitest
  let vitestRunning: boolean = false
  let ws: WebSocketServer

  async function startVitest() {
    if (!vitest) {
      process.env.VITEST = 'true'
      vitest = await createVitest('test', {
        root: rootDir,
        watch: false,
        passWithNoTests: false,
        reporters: [new CompodiumReporter(ws)],
        silent: true
      })

      vitest.projects = vitest.projects.filter(c => c.name.includes('compodium'))
    }
    await vitest.start()
  }

  return {
    name: 'compodium:tests',
    enforce: 'post',

    configResolved(viteConfig) {
      rootDir = options.rootDir ?? viteConfig.root
    },

    configureServer(server) {
      ws = server.ws

      server.middlewares.use('/__compodium__/devtools/api/test', async (_req, res) => {
        if (vitestRunning) return
        vitestRunning = true
        try {
          await startVitest()
          res.end()
        } catch (err) {
          res.statusCode = 500
          console.error(err)
          res.end(JSON.stringify(err))
        } finally {
          vitestRunning = false
        }
      })
    },

    async configureVitest({ project, injectTestProjects }) {
      await injectTestProjects({
        extends: project.vite.config.configFile,
        test: {
          name: 'compodium',
          include: [resolvePathSync('../../runtime/tests/spec.ts', { url: import.meta.url })],
          exclude: [],

          provide: {
            'compodium.options': JSON.parse(JSON.stringify(options)),
            'compodium.dir': joinURL(rootDir, options.dir)
          },

          environment: options._nuxt ? 'nuxt' : 'happy-dom',

          browser: {
            enabled: true,
            // TODO: Handle Nuxt and move index.html into @compodium/vue?
            testerHtmlPath: options._nuxt ? undefined : resolvePathSync('../../runtime/tests/index.html', { url: import.meta.url }),
            headless: true,
            screenshotFailures: false,
            provider: 'playwright',
            instances: [
              // TODO: Add option to pass browser instances
              { browser: 'chromium' }
              // { browser: 'firefox' }
            ]
          }
        }
      })
    }
  }
}
