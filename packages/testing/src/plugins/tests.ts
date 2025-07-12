/// <reference types="vitest" />
/// <reference types="@vitest/browser/providers/playwright" />

import type { VitePlugin } from 'unplugin'
import { joinURL } from 'ufo'
import { resolvePathSync } from 'mlly'
import { createVitest } from 'vitest/node'
import type { BrowserCommand, Vitest } from 'vitest/node'
import type { PluginOptions } from '@compodium/core'
import { CompodiumReporter } from './reporter'
import type { WebSocketServer } from 'vite'
import fs from 'node:fs/promises'
import { DefaultReporter } from 'vitest/reporters'
import { resolve } from 'pathe'

declare module '@vitest/browser/context' {
  interface BrowserCommands {
    waitForNetworkIdle: () => Promise<void>
  }
}

// TODO: This is not stable
const waitForNetworkIdle: BrowserCommand<[]> = async ({
  frame,
  provider
}) => {
  if (provider.name === 'playwright') {
    const f = await frame()
    await f.waitForLoadState('domcontentloaded', { timeout: 2000 })
    await f.waitForLoadState('networkidle', { timeout: 2000 })
  } else {
    throw new Error(`provider ${provider.name} is not supported`)
  }
}

export function testPlugin(options: PluginOptions): VitePlugin {
  let rootDir: string

  let vitest: Vitest
  let vitestRunning: boolean = false
  let ws: WebSocketServer

  async function getVitest() {
    if (!vitest) {
      vitest = await createVitest('test', {
        root: rootDir,
        watch: false,
        passWithNoTests: true,
        reporters: [new DefaultReporter(), new CompodiumReporter(ws)],
        silent: false,
        env: {
          VITEST: 'true'
        }
      })
      vitest.projects = vitest.projects.filter(c => c.name.includes('compodium'))
    }

    return vitest
  }

  async function startVitest(filter?: string | null, updateSnapshots?: boolean) {
    const vitest = await getVitest()
    if (filter) {
      vitest.projects.forEach(project => project.config.testNamePattern = new RegExp(filter))
    } else {
      vitest.projects.forEach(project => project.config.testNamePattern = undefined)
    }

    if (updateSnapshots) {
      vitest.enableSnapshotUpdate()
    } else {
      vitest.resetSnapshotUpdate()
    }

    await vitest.start()
  }

  return {
    name: 'compodium:tests',
    enforce: 'post',
    config() {
      return {
        test: {
          browser: {
            commands: {
              waitForNetworkIdle
            }
          }
        }
      }
    },

    configResolved(viteConfig) {
      rootDir = options.rootDir ?? viteConfig.root
    },

    configureServer(server) {
      ws = server.ws

      server.middlewares.use('/__compodium__/devtools/api/stop-tests', async (req, res) => {
        if (!vitestRunning) {
          res.statusCode = 200
          res.end()
          return
        }

        try {
          const vitest = await getVitest()
          await vitest.cancelCurrentRun('keyboard-input')
          res.end()
        } catch (err) {
          res.statusCode = 500
          console.error(err)
          res.end(JSON.stringify(err))
        } finally {
          vitestRunning = false
        }
      })

      server.middlewares.use('/__compodium__/devtools/api/test', async (req, res) => {
        if (vitestRunning) {
          res.statusCode = 423
          res.end()
          return
        }

        vitestRunning = true

        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const components = url.searchParams.getAll('component')
          const updateSnapshots = !!url.searchParams.get('update')

          await startVitest(components?.length ? components.join('|') : undefined, updateSnapshots)
          res.end()
        } catch (err) {
          res.statusCode = 500
          console.error(err)
          res.end(JSON.stringify(err))
        } finally {
          vitestRunning = false
        }
      })

      server.middlewares.use('/__compodium__/devtools/api/screenshot', async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const component = url.searchParams.get('component')
          const screenshot = joinURL(rootDir, options.dir, `./__screenshots__/${component}.png`)

          try {
            await fs.access(screenshot)
          } catch {
            res.statusCode = 404
            res.end('Screenshot not found')
            return
          }

          const imageBuffer = await fs.readFile(screenshot)

          res.setHeader('Content-Type', 'image/png')
          res.setHeader('Content-Length', imageBuffer.length)
          res.end(imageBuffer)
        } catch (err) {
          res.statusCode = 500
          console.error(err)
          res.end(JSON.stringify(err))
        }
      })
    },

    async configureVitest({ project, injectTestProjects }) {
      const testDir = joinURL(resolve(rootDir, options.dir), './test')

      await injectTestProjects({
        extends: project.vite.config.configFile,
        test: {
          name: 'compodium',
          include: [
            resolvePathSync('../runtime/spec.ts', { url: import.meta.url }),
            `${testDir}/**/*.{test,spec}.?(c|m)[jt]s?(x)`
          ],
          exclude: [],

          provide: {
            'compodium.options': JSON.parse(JSON.stringify(options)),
            'compodium.dir': joinURL(rootDir, options.dir)
          },

          environment: options._nuxt ? 'nuxt' : 'happy-dom',

          browser: {
            enabled: true,
            // TODO: Handle Nuxt and move index.html into @compodium/vue?
            testerHtmlPath: options._nuxt ? undefined : resolvePathSync('../runtime/index.html', { url: import.meta.url }),
            headless: true,
            screenshotFailures: false,
            provider: 'playwright',
            viewport: {
              width: 1024,
              height: 1024
            },
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
