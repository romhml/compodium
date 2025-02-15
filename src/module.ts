import { addCustomTab, startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, addTemplate, addServerHandler } from '@nuxt/kit'
import { getPort } from 'get-port-please'
import { camelCase } from 'scule'
import sirv from 'sirv'
import type { CollectionConfig } from '.'
import { scanComponents } from './utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { defu } from 'defu'
import { defaultProps } from './libs/defaults'

export interface ModuleOptions {
  /* Customize the preview component path. Defaults to compodium/preview.vue */
  previewComponent: string
  /* Customize the directory for preview examples */
  examples?: string
  /*  */
  collections: CollectionConfig[]
  /* Whether or not to include default collections for third party libraries. */
  includeDefaultCollections?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'compodium',
    configKey: 'compodium'
  },
  defaults: {
    previewComponent: 'compodium/preview.vue',
    examples: 'compodium/examples',
    collections: [
      { name: 'Components', match: 'components/' }
    ]
  },

  async setup(options, nuxt) {
    if (!nuxt.options.dev) return

    const { resolve } = createResolver(import.meta.url)
    const appResolver = createResolver(nuxt.options.rootDir)

    nuxt.options.appConfig.compodium = {}

    const libraryCollections = [
      { id: 'ui', name: 'Nuxt UI', match: '@nuxt/ui', external: true, icon: 'lineicons:nuxt', prefix: (nuxt.options as any).ui?.prefix, examplePath: 'libs/examples/ui' }
    ]

    const previewComponent = appResolver.resolve(options.previewComponent)
    const defaultPreviewComponent = resolve('./runtime/preview.vue')

    nuxt.options.appConfig.compodium = {
      collections: options.collections.map(c => ({ ...c, id: camelCase(c.name) })).concat(libraryCollections),
      previewComponent,
      defaultPreviewComponent
    }

    nuxt.options.appConfig.compodium = defu(nuxt.options.appConfig.compodium, { defaultProps })

    nuxt.hook('app:resolve', (app) => {
      nuxt.options.appConfig.compodium.rootComponent = app.rootComponent
      app.rootComponent = resolve('./runtime/root.vue')
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
          pattern: '**/*.{vue,ts,tsx}'
        }, ...libraryCollections.map(c => ({ path: resolve(c.examplePath), pattern: '**/*.{vue,ts,tsx}', prefix: c.prefix }))], appResolver.resolve(''))).map(c => ({ ...c, isExample: true }))
      : []

    nuxt.options.appConfig.compodium.exampleComponents = exampleComponents

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

    addServerHandler({
      method: 'get',
      route: '/__compodium__/api/colors',
      handler: resolve('./runtime/server/api/colors.get')
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
