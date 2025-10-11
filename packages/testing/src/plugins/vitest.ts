import type { Vitest, InlineConfig } from 'vitest/node'
import type { PluginOptions, TestConfig } from '@compodium/core'
import type { Plugin as VitePlugin } from 'vite'
import { defu } from 'defu'

export function testPlugin(options: PluginOptions): VitePlugin {
  let rootDir: string
  let vitest: Vitest

  async function getVitest() {
    if (!vitest) {
      const { createVitest } = await import('vitest/node')
      const viteConfig = options._vitestConfig ? await options._vitestConfig : {} as TestConfig
      const vitestConfig = defu(
        {
          root: rootDir,
          watch: true,
          passWithNoTests: true,
          silent: true,
          api: true,
          ui: false
        } satisfies InlineConfig,
        viteConfig.test
      )

      vitest = await createVitest('test', vitestConfig, viteConfig as any)
    }
    return vitest
  }

  return {
    name: 'compodium:tests',

    configResolved(viteConfig) {
      rootDir = options.rootDir ?? viteConfig.root
    },

    configureServer(server) {
      server.middlewares.use('/__compodium__/api/test/start', async (_req, res) => {
        try {
          const vitest = await getVitest()
          await vitest.init()
          await vitest.collect()
          res.end(JSON.stringify({ port: vitest.config.api.port, token: vitest.config.api.token }))
        } catch (err) {
          res.statusCode = 500
          console.error(err)
          res.end(JSON.stringify(err))
        }
      })
    }
  }
}
