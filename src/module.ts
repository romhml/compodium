import type { Collection, CollectionConfig } from './types'
import { existsSync, readFileSync } from 'node:fs'
import { addCustomTab, startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, addTemplate, addServerHandler, addVitePlugin, updateTemplates, addImportsDir, logger, addComponentsDir } from '@nuxt/kit'
import { getPort } from 'get-port-please'
import { camelCase, pascalCase } from 'scule'
import sirv from 'sirv'
import { scanComponents } from './nuxt'
import { getComponentCollection } from './runtime/utils'
import { basename, join } from 'pathe'
import { defu } from 'defu'
import { defaultProps } from './runtime/libs/defaults'
import { watch } from 'chokidar'
import { compodiumVite } from './vite'
import { colors } from 'consola/utils'
import { version } from '../package.json'
import { joinURL } from 'ufo'
import { getLibraryCollections } from './runtime/libs'

export interface ModuleOptions {
  /* Whether to include default collections for third-party libraries. */
  includeDefaultCollections: boolean

  /* Customize the directory for preview examples. Defaults to 'compodium/' */
  examples: string

  /* Customize the preview component path. Defaults to compodium/preview.vue */
  previewComponent: string

  extras: {
    ui: {
      /* If true, Compodium's UI will match your Nuxt UI color theme */
      matchColors: boolean
    }
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'compodium',
    configKey: 'compodium'
  },
  defaults: {
    previewComponent: 'compodium/preview.vue',
    examples: 'compodium/',
    includeDefaultCollections: true,
    extras: {
      ui: {
        matchColors: true
      }
    }
  },

  async setup(options, nuxt) {
    // Only the extendCompodiumMeta composable is injected in production
    // It won't do anything but this is required to avoid runtime errors.
    // Might look into removing it completely using vite.
    const { resolve } = createResolver(import.meta.url)
    addImportsDir(resolve('./runtime/composables'))

    if (!nuxt.options.dev) return

    const appResolver = createResolver(nuxt.options.rootDir)
    const libraryCollections = options.includeDefaultCollections ? await getLibraryCollections(nuxt.options, appResolver) : []

    let previewComponent = appResolver.resolve(options.previewComponent)
    if (!existsSync(previewComponent)) {
      previewComponent = resolve('./runtime/preview.vue')
    }

    addTemplate({
      filename: 'compodium/preview.mjs',
      getContents: () => `export { default } from '${previewComponent}'`
    })

    const appConfig = nuxt.options.appConfig

    appConfig.compodium = defu(appConfig.compodium as any, {
      matchUIColors: options.extras?.ui?.matchColors,
      defaultProps,
      componentsPath: join(nuxt.options.buildDir, '/compodium/components.json')
    })

    nuxt.hooks.hookOnce('app:resolve', (app) => {
      const rootComponent = app.rootComponent
      app.rootComponent = resolve('./runtime/root.vue')

      addTemplate({
        filename: 'compodium/root.mjs',
        getContents: () => `export { default } from '${rootComponent}'`
      })
    })

    // Injects a placeholder page for the renderer to silence warnings if the router integration is enabled.
    nuxt.hooks.hookOnce('pages:extend', (pages) => {
      if (pages.length) pages.push({ path: '/__compodium__/renderer', file: resolve('./runtime/renderer-placeholder.vue') })
    })

    // This file will be read directly server side. This is a hack after realising that virtual module didn't work with HMR server side.
    nuxt.options.nitro.virtual = nuxt.options.nitro.virtual || {}
    nuxt.options.nitro.virtual['#compodium/nitro/dirs'] = () => {
      return readFileSync(join(nuxt.options.buildDir, '/compodium/dirs.mjs'), 'utf-8')
    }
    nuxt.options.nitro.virtual['#compodium/nitro/collections'] = () => {
      return readFileSync(join(nuxt.options.buildDir, '/compodium/collections.mjs'), 'utf-8')
    }

    nuxt.hooks.hookOnce('components:dirs', async (dirs) => {
      const collections = dirs.map((dir) => {
        const path = typeof dir === 'string' ? dir : dir.path
        const id = basename(path)
        return {
          ...typeof dir === 'string' ? {} : dir,
          path,
          name: pascalCase(id),
          id
        }
      })

      const examplesDirs = collections.map(collection => ({
        ...collection,
        path: appResolver.resolve(joinURL(options.examples, collection.id)),
        pattern: '**/*.{vue,ts,tsx}'
      }))

      const libraryExampleDirs = libraryCollections.map(c => ({
        path: resolve(c.examplePath),
        pattern: '**/*.{vue,ts,tsx}',
        prefix: c.prefix
      }))

      // @ts-expect-error type not resolved
      appConfig.compodium.collections = collections.concat(libraryCollections)

      const exampleComponents = options.examples
        ? (await scanComponents([
            ...examplesDirs,
            ...libraryExampleDirs
          ], nuxt.options.rootDir)).map(c => ({ ...c, isExample: true }))
        : []

      // Watch for changes in example directory
      const examplesWatcher = watch([...examplesDirs, ...libraryExampleDirs].map(e => e.path), {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      })

      examplesWatcher.on('add', async (path) => {
        const comps = await scanComponents(examplesDirs, nuxt.options.rootDir)
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
        getContents: ({ app }) => {
          const collections = (appConfig.compodium as any).collections
          const components = [...app.components, ...exampleComponents].reduce((acc, component) => {
            const collection = getComponentCollection<CollectionConfig & Collection>(component, collections)
            const componentId = camelCase(component.kebabName)
            const baseName = collection?.prefix
              ? component.pascalName.replace(new RegExp(`^${pascalCase(collection?.prefix)}`), '')
              : component.pascalName

            acc[componentId] = {
              ...component,
              baseName,
              componentId,
              collectionId: collection?.id,
              docUrl: collection?.getDocUrl?.(component.pascalName)
            }
            return acc
          }, {} as Record<string, any>)

          return JSON.stringify(components, null, 2)
        }
      })

      addTemplate({
        filename: 'compodium/dirs.mjs',
        write: true,
        getContents: () => {
          return `export default ${JSON.stringify([...dirs, ...examplesDirs, ...libraryExampleDirs])}`
        }
      })

      addTemplate({
        filename: 'compodium/collections.mjs',
        write: true,
        getContents: () => {
          return `export default ${JSON.stringify(collections.concat(libraryCollections))}`
        }
      })

      // This file will be read directly server side. This is a hack after realising that virtual module didn't work with HMR server side.
      nuxt.options.nitro.virtual!['#compodium/nitro/dirs'] = () => {
        return readFileSync(join(nuxt.options.buildDir, '/compodium/dirs.mjs'), 'utf-8')
      }
      nuxt.options.nitro.virtual!['#compodium/nitro/collections'] = () => {
        return readFileSync(join(nuxt.options.buildDir, '/compodium/collections.mjs'), 'utf-8')
      }

      addVitePlugin(compodiumVite({
        dirs: [...dirs, ...examplesDirs, ...libraryExampleDirs]
      }))

      addComponentsDir({ path: resolve('./runtime/components'), priority: -1 })
    })

    if (process.env.COMPODIUM_LOCAL === 'true') {
      const PORT = await getPort({ port: 42124 })

      nuxt.hooks.hookOnce('app:resolve', () => {
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
    } else if (process.env.COMPODIUM_TEST !== 'true') {
      nuxt.hook('vite:serverCreated', async (server) => {
        server.middlewares.use('/__compodium__/devtools', sirv(resolve('../dist/client/devtools'), { single: true }))
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
      route: '/__compodium__/api/reload-meta',
      handler: resolve('./runtime/server/api/reload-meta.get')
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

    addServerHandler({
      method: 'get',
      route: '/__compodium__/api/iconify',
      handler: resolve('./runtime/server/api/iconify.get')
    })

    addCustomTab({
      name: 'compodium',
      title: 'Compodium',
      icon: 'lucide:book-marked',
      view: {
        type: 'iframe',
        src: '/__compodium__/devtools/components'
      }
    })

    nuxt.hook('listen', (_, listener) => {
      const url = joinURL(listener.url, '/__compodium__/devtools')
      console.log('')
      logger.log([
        colors.magenta(`  ➜ Compodium:`),
        colors.dim(` available in`),
        colors.yellow(` DevTools`),
        colors.gray(` (v${version})`),
        '\n',
        colors.gray(`               ${url}`),
        '\n'
      ].join(''))
    })
  }
})
