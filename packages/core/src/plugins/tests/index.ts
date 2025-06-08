/// <reference types="vitest" />
import type { VitePlugin } from 'unplugin'
import { resolve } from 'pathe'
import { joinURL } from 'ufo'
import { resolvePathSync } from 'mlly'
import { type Vitest, createVitest } from 'vitest/node'

import type { PluginConfig } from '../../types'
import { scanComponents } from '../utils'
import CompodiumReporter from './reporter'
import type { WebSocketServer } from 'vite'

export function testPlugin(config: PluginConfig): VitePlugin {
  let vitest: Vitest
  let vitestRunning: boolean = false

  let ws: WebSocketServer

  async function startVitest() {
    if (!vitest) {
      process.env.VITEST = 'true'
      vitest = await createVitest('test', {
        root: config.rootDir,
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
    config: () => ({
      resolve: {
        alias: {
          '@compodium/core/testing': resolvePathSync('../../testing.ts', { url: import.meta.url })
        }
      }
    }),

    configureServer(server) {
      ws = server.ws

      server.middlewares.use('/__compodium__/devtools/api/test', async (_req, res) => {
        try {
          if (!vitestRunning) {
            vitestRunning = true
            await startVitest().finally(() => vitestRunning = false)
          }
          res.end()
        } catch (err) {
          res.statusCode = 500
          console.error(err)
          res.end(JSON.stringify(err))
        }
      })
    },

    async configureVitest({ project, injectTestProjects }) {
      if (!config.tests) return
      const collections = await Promise.all([config.componentCollection, ...config.libraryCollections].map(async (col) => {
        const components = await scanComponents(col.dirs, config.rootDir)
        const examples = await scanComponents([col.exampleDir], config.rootDir)

        const collectionComponents = components.map((c) => {
          const componentExamples = examples?.filter(e => e.pascalName.startsWith(`${c.pascalName}Example`)).map(e => ({
            ...e,
            filePath: resolve(config.rootDir, e.filePath),
            isExample: true,
            componentPath: resolve(config.rootDir, c.filePath)
          }))

          const mainExample = componentExamples.find(e => e.pascalName === `${c.pascalName}Example`)
          const component = mainExample ?? c

          return {
            ...component,
            filePath: resolve(config.rootDir, component.filePath),
            wrapperComponent: col.wrapperComponent,
            docUrl: col.getDocUrl?.(c.pascalName),
            examples: componentExamples.filter(e => e.pascalName !== mainExample?.pascalName)
          }
        })

        return {
          ...col,
          components: collectionComponents
        }
      }))

      await injectTestProjects({
        extends: project.vite.config.configFile,
        test: {
          name: 'compodium',
          setupFiles: ['vitest-browser-vue'],
          include: [resolvePathSync('../../runtime/tests/spec.ts', { url: import.meta.url })],
          exclude: [],
          snapshotEnvironment: resolvePathSync('../../runtime/tests/snapshots.ts', { url: import.meta.url }),

          provide: {
            'compodium.config': JSON.parse(JSON.stringify(config)),
            'compodium.collections': JSON.parse(JSON.stringify(collections)),
            'compodium.root': joinURL(project.vite.config.root, config.dir)
          },

          environment: config._nuxt ? 'nuxt' : 'happy-dom',
          root: joinURL(project.vite.config.root, config.dir),

          browser: {
            enabled: true,
            headless: true,
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
