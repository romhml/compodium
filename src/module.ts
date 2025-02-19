import type { CollectionConfig } from './types'
import { addCustomTab, startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, addTemplate, addServerHandler, addVitePlugin, updateTemplates } from '@nuxt/kit'
import { getPort } from 'get-port-please'
import { camelCase, kebabCase } from 'scule'
import sirv from 'sirv'
import { scanComponents } from './nuxt'
import { getComponentCollection } from './runtime/utils'
import { readFileSync } from 'node:fs'
import { join } from 'pathe'
import { defu } from 'defu'
import { defaultProps } from './libs/defaults'
import { watch } from 'chokidar'
import { compodiumVite } from './vite'

export interface ModuleOptions {
  /* Customize the preview component path. Defaults to compodium/preview.vue */
  previewComponent: string
  /* Customize the directory for preview examples */
  examples: string
  /*  */
  collections?: CollectionConfig[]
  /* Whether or not to include default collections for third party libraries. */
  includeDefaultCollections: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'compodium',
    configKey: 'compodium'
  },
  defaults: {
    previewComponent: 'compodium/preview.vue',
    examples: 'compodium/examples',
    includeDefaultCollections: true
  },

  async setup(options, nuxt) {
    if (!nuxt.options.dev) return

    const { resolve } = createResolver(import.meta.url)
    const appResolver = createResolver(nuxt.options.rootDir)

    options.collections ??= [
      { name: 'Components', path: 'components/' }
    ]

    nuxt.options.appConfig.compodium = {}

    const libraryCollections = options.includeDefaultCollections
      ? [{
          id: 'ui',
          name: 'Nuxt UI',
          path: '@nuxt/ui',
          external: true,
          icon: 'lineicons:nuxt',
          prefix: (nuxt.options as any).ui?.prefix,
          examplePath: 'libs/examples/ui',
          ignore: ['App.vue', 'Toast.vue', '*Provider.vue', '*Base.vue', '*Content.vue'],
          getDocUrl(componentName: string) {
            const prefix = (nuxt.options as any).ui?.prefix ?? 'U'
            return `https://ui3.nuxt.dev/components/${kebabCase(componentName.replace(new RegExp(`^${prefix}`), ''))}`
          }
        }]
      : []

    const previewComponent = appResolver.resolve(options.previewComponent)
    const defaultPreviewComponent = resolve('./runtime/preview.vue')

    nuxt.options.appConfig.compodium = {
      collections: options.collections.map(c => ({ ...c, id: camelCase(c.name), path: appResolver.resolve(c.path) })).concat(libraryCollections)
    }

    const appConfig = nuxt.options.appConfig
    appConfig.compodium = defu(nuxt.options.appConfig.compodium as any, { defaultProps })

    nuxt.hook('app:resolve', (app) => {
      const rootComponent = app.rootComponent
      const compodiumRoot = resolve('./runtime/root.vue')

      if (rootComponent !== compodiumRoot) {
        app.rootComponent = compodiumRoot

        addTemplate({
          filename: 'compodium/root.mjs',
          getContents: () => `export { default } from '${rootComponent}'`
        })
      }
    })

    addTemplate({
      filename: 'compodium/preview.mjs',
      getContents: () => `export { default } from '${previewComponent}'`
    })

    addTemplate({
      filename: 'compodium/default-preview.mjs',
      getContents: () => `export { default } from '${defaultPreviewComponent}'`
    })

    // Watch for changes in example directory
    const examplesDir = appResolver.resolve(options.examples)
    const examplesWatcher = watch(examplesDir, {
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    })

    const libraryExampleDirs = libraryCollections.map(c => ({ path: resolve(c.examplePath), pattern: '**/*.{vue,ts,tsx}', prefix: c.prefix }))
    const exampleComponents = options.examples
      ? (await scanComponents([{
          path: examplesDir,
          pattern: '**/*.{vue,ts,tsx}'
        }, ...libraryExampleDirs], nuxt.options.rootDir)).map(c => ({ ...c, isExample: true }))
      : []

    // FIXME: This might cause a race condition with the vite plugin.
    examplesWatcher.on('add', async (path) => {
      const comps = await scanComponents([{ path: examplesDir, pattern: '**/*.{vue,ts,tsx}' }], nuxt.options.rootDir)
      const newExample = comps.find(c => c.filePath === path)
      if (newExample) {
        exampleComponents.push({ ...newExample, isExample: true })
        await updateTemplates({
          filter: template => template.filename === 'compodium/components.json'
        })
      }
    })

    examplesWatcher.on('unlink', async (path) => {
      const index = exampleComponents.findIndex(c => c.filePath === path)
      if (index !== -1) exampleComponents.splice(index, 1)
      await updateTemplates({
        filter: template => template.filename === 'compodium/components.json'
      })
    })

    addTemplate({
      filename: 'compodium/components.json',
      write: true,
      getContents: ({ nuxt, app }) => {
        const collections = (nuxt.options.appConfig.compodium as any).collections
        const components = [...app.components, ...exampleComponents]
        return JSON.stringify(components.reduce((acc, component) => {
          const collection = getComponentCollection<CollectionConfig>(component, collections)
          acc[component.pascalName] = {
            ...component,
            docUrl: collection?.getDocUrl?.(component.pascalName)
          }
          return acc
        }, {} as Record<string, any>), null, 2)
      }
    })

    nuxt.hook('components:dirs', (dirs) => {
      addTemplate({
        filename: 'compodium/dirs.mjs',
        write: true,
        getContents: () => {
          return `export default ${JSON.stringify(dirs)}`
        }
      })
      addVitePlugin(compodiumVite({ dirs: [...dirs, examplesDir] }))
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

    // This file will be read directly server side. This is a hack after realising that virtual module didn't work with HMR server side.
    nuxt.options.nitro.virtual = nuxt.options.nitro.virtual || {}
    nuxt.options.nitro.virtual['#compodium/nitro/dirs'] = () => {
      return readFileSync(join(nuxt.options.buildDir, '/compodium/dirs.mjs'), 'utf-8')
    }
    (appConfig.compodium as any).componentsPath = join(nuxt.options.buildDir, '/compodium/components.json')

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
        src: '/__compodium__/devtools/components'
      }
    })
  }
})
