/// <reference types="vitest" />
/// <reference types="@vitest/browser/providers/playwright" />

import type { VitePlugin } from 'unplugin'
import { joinURL } from 'ufo'
import { resolvePathSync } from 'mlly'
import { createVitest } from 'vitest/node'
import type { BrowserCommand, Vitest } from 'vitest/node'
import type { PluginOptions } from '@compodium/core'
import CompodiumReporter from './reporter'
import type { WebSocketServer } from 'vite'
import fs from 'node:fs/promises'
import { dirname } from 'pathe'

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
        watch: true,
        passWithNoTests: false,
        reporters: [new CompodiumReporter(ws)],
        silent: true,
        env: {
          VITEST: 'true'
        }
      })
      vitest.projects = vitest.projects.filter(c => c.name.includes('compodium'))
    }

    return vitest
  }

  async function startVitest(filter?: string | null) {
    const vitest = await getVitest()
    if (filter) {
      vitest.projects.forEach(project => project.config.testNamePattern = new RegExp(filter))
    } else {
      vitest.projects.forEach(project => project.config.testNamePattern = undefined)
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

          await startVitest(components?.length ? components.join('|') : undefined)
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

      server.middlewares.use('/__compodium__/devtools/api/accept-changes', async (req, res) => {
        if (req.method !== 'PUT') {
          res.statusCode = 405
          res.end()
        }

        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const component = url.searchParams.get('component')
          const screenshot = joinURL(rootDir, options.dir, `./__screenshots__/${component}.png`)
          const stagedPath = joinURL(rootDir, options.dir, `./__screenshots__/staged/${component}.png`)

          try {
            await fs.access(screenshot)
          } catch {
            res.statusCode = 404
            res.end('Screenshot not found')
            return
          }

          await fs.mkdir(dirname(stagedPath), { recursive: true })
          await fs.copyFile(screenshot, stagedPath)
          await fs.rm(screenshot, { force: true })

          res.statusCode = 200
          res.end()
        } catch (err) {
          res.statusCode = 500
          console.error(err)
          res.end(JSON.stringify(err))
        }
      })
    },

    async configureVitest({ project, injectTestProjects }) {
      await injectTestProjects({
        extends: project.vite.config.configFile,
        test: {
          name: 'compodium',
          include: [resolvePathSync('../runtime/spec.ts', { url: import.meta.url })],
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
