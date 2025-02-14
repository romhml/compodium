import { addCustomTab, startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, addImportsDir, addTemplate, addServerHandler } from '@nuxt/kit'
import defu from 'defu'
import { getPort } from 'get-port-please'
import sirv from 'sirv'
import { compodiumMetaPlugin } from './meta'
import type { Collection } from './types'
import { scanComponents } from './utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface ModuleOptions {
  rootComponent?: string
  examples?: string
  collections: Collection[]
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'compodium',
    configKey: 'compodium'
  },
  defaults: {
    examples: 'compodium/examples',
    collections: [
      { name: 'Components', match: 'components/' },
      { name: 'Nuxt UI', match: '@nuxt/ui', external: true, icon: 'lineicons:nuxt' }
    ]
  },
  async setup(options, nuxt) {
    if (!nuxt.options.dev) return

    const { resolve } = createResolver(import.meta.url)
    const appResolver = createResolver(nuxt.options.rootDir)

    addImportsDir(resolve('./runtime/composables'))

    nuxt.options.appConfig._compodium = {
      ...options,
      rootComponent: options.rootComponent ? appResolver.resolve(options.rootComponent) : undefined
    } as any

    nuxt.options.vite = defu(nuxt.options?.vite, { plugins: [compodiumMetaPlugin({ resolve: appResolver.resolve, options })] })
    nuxt.hook('app:resolve', (app) => {
      (nuxt.options.appConfig._compodium as any).appRootComponent = app.rootComponent
      app.rootComponent = resolve('./runtime/custom-root.vue')
    })

    nuxt.hook('components:dirs', (dirs) => {
      addTemplate({
        filename: 'compodium/dirs.mjs',
        write: true,
        getContents: () => {
          return `export default ${JSON.stringify(dirs)}`
        }
      })
    })

    const exampleComponents = options.examples
      ? (await scanComponents([{
          path: appResolver.resolve(options.examples),
          pattern: `**/*.{vue,ts,tsx}`
        }], appResolver.resolve(''))).map(c => ({ ...c, isExample: true }))
      : []

    // @ts-expect-error unresolved internal type
    nuxt.options.appConfig._compodium.exampleComponents = exampleComponents

    // Generate component templates
    addTemplate({
      filename: 'compodium/components.mjs',
      write: true,
      getContents: ({ app }) => {
        return `export default ${JSON.stringify(app.components.concat(exampleComponents).reduce((acc, c) => {
          acc[c.pascalName] = c
          return acc
        }, {} as Record<string, any>), null, 2)}`
      }
    })

    // Nitro setup
    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.handlers = nitroConfig.handlers || []
      nitroConfig.virtual = nitroConfig.virtual || {}
      nitroConfig.virtual['#compodium/nitro/components'] = () => readFileSync(join(nuxt.options.buildDir, '/compodium/components.mjs'), 'utf-8')
      nitroConfig.virtual['#compodium/nitro/dirs'] = () => readFileSync(join(nuxt.options.buildDir, '/compodium/dirs.mjs'), 'utf-8')
    })

    // Should scan the example directory, match them to components and integrate them into collections.
    if (process.env.COMPODIUM_LOCAL) {
      const PORT = await getPort({ port: 42124 })

      nuxt.hook('app:resolve', () => {
        startSubprocess(
          {
            command: 'pnpm',
            args: ['nuxi', 'dev'],
            cwd: './devtools',
            stdio: 'pipe',
            env: {
              PORT: PORT.toString()
            }
          },
          {
            id: 'compodium:devtools',
            name: 'Compodium Devtools'
          },
          nuxt
        )
      })

      nuxt.hook('vite:extendConfig', (config) => {
        config.server ||= {}
        config.server.proxy ||= {}
        config.server.proxy['/__compodium__/devtools'] = {
          target: `http://localhost:${PORT}`,
          changeOrigin: true,
          followRedirects: true,
          ws: true,
          rewriteWsOrigin: true
        }
      })
    } else {
      nuxt.hook('vite:serverCreated', async (server) => {
        server.middlewares.use('/__compodium__/devtools', sirv(resolve('../dist/client/devtools'), {
          single: true,
          dev: true
        }))
      })
    }

    addServerHandler({
      method: 'get',
      route: '/__compodium__/api/collections',
      handler: resolve('./runtime/server/api/collections.get')
    })

    addServerHandler({
      method: 'get',
      route: '/__compodium__/api/component-meta/:component',
      handler: resolve('./runtime/server/api/component-meta.get')
    })

    addServerHandler({
      method: 'get',
      route: '/__compodium__/api/example/:component',
      handler: resolve('./runtime/server/api/example.get')
    })

    addCustomTab({
      name: 'compodium',
      title: 'Compodium',
      icon: '/__compodium__/devtools/favicon.svg',
      view: {
        type: 'iframe',
        src: '/__compodium__/devtools'
      }
    })
  }
})
