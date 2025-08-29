/// <reference types="vitest" />
/// <reference types="@vitest/browser/providers/playwright" />

import { createVitest } from 'vitest/node'
import type { Vitest } from 'vitest/node'
import type { PluginOptions } from '@compodium/core'
import { CompodiumReporter } from './reporter'
import type { WebSocketServer, Plugin as VitePlugin } from 'vite'
import { DefaultReporter } from 'vitest/reporters'

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
        silent: true,
        env: {
          VITEST: 'true'
        }
      })
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
    }
  }
}
