import { startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, installModule, addImportsDir, addTemplate, hasNuxtModule, addServerHandler } from '@nuxt/kit'
import defu from 'defu'
import { getPort } from 'get-port-please'
import sirv from 'sirv'
import { compodiumMetaPlugin } from './meta'
import type { Collection } from './types'
import type { ComponentData } from 'nuxt-component-meta'
import { scanComponents } from './utils'

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
    const { resolve } = createResolver(import.meta.url)
    const appResolver = createResolver(nuxt.options.rootDir)

    addImportsDir(resolve('./runtime/composables'))

    nuxt.options.appConfig._compodium = {
      ...options,
      rootComponent: options.rootComponent ? appResolver.resolve(options.rootComponent) : undefined
    }

    async function registerModule(name: string, options?: Record<string, any>, optionKey?: string) {
      if (!hasNuxtModule(name)) {
        await installModule(name, options)
      } else {
        (nuxt.options as any)[optionKey ?? name] = defu((nuxt.options as any)[optionKey ?? name], options)
      }
    }

    registerModule('nuxt-component-meta', {
      include: [
        (component: ComponentData) => options.collections.find((c) => {
          if (!c.external && component.filePath?.match('node_modules/')) return false
          return component.filePath?.match(c.match)
        })
      ],
      metaFields: {
        type: false,
        props: true,
        slots: true,
        events: false,
        exposed: false
      }
    }, 'componentMeta')

    nuxt.options.vite = defu(nuxt.options?.vite, { plugins: [compodiumMetaPlugin({ resolve: appResolver.resolve, options })] })
    nuxt.hook('app:resolve', (app) => {
      (nuxt.options.appConfig._compodium as any).appRootComponent = app.rootComponent
      app.rootComponent = resolve('./runtime/custom-root.vue')
    })

    const exampleComponents = options.examples
      ? await scanComponents([{
        path: appResolver.resolve(options.examples),
        pattern: `**/*.{vue,ts,tsx}`
      }], appResolver.resolve(''))
      : []

    // @ts-expect-error unresolved internal type
    nuxt.options.appConfig._compodium.exampleComponents = exampleComponents

    // Generate component templates
    addTemplate({
      filename: 'compodium/components.json',
      write: true,
      getContents: ({ app }) => JSON.stringify(app.components.concat(exampleComponents).reduce((acc, c) => {
        acc[c.pascalName] = c.filePath
        return acc
      }, {} as Record<string, any>), null, 2)
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
      route: '/__compodium__/api/example/:component',
      handler: resolve('./runtime/server/api/example.get')
    })

    nuxt.options.routeRules = defu(nuxt.options.routeRules, { '/__compodium__/**': { ssr: false } })
  }
})
