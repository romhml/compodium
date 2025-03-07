import { existsSync } from 'node:fs'
import { addCustomTab, startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, addTemplate, addVitePlugin, addImportsDir, logger, addComponentsDir } from '@nuxt/kit'
import { getPort } from 'get-port-please'
import sirv from 'sirv'
import { join } from 'pathe'
import { defu } from 'defu'
import { colors } from 'consola/utils'
import { joinURL, withTrailingSlash } from 'ufo'
import micromatch from 'micromatch'

import { version } from '../package.json'
import { scanComponents } from './nuxt'
import { CompodiumPlugin, type PluginOptions } from './unplugin'
import { getLibraryCollections } from './runtime/libs'
import { defaultProps } from './runtime/libs/defaults'

export type * from './types'

export type ModuleOptions = Omit<PluginOptions, 'componentDirs'>

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'compodium',
    configKey: 'compodium'
  },
  defaults: {
    dir: 'compodium/',
    includeLibraryCollections: true,
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

    const compodiumComponentsDir = resolve('./runtime/components')
    addComponentsDir({ path: compodiumComponentsDir, priority: -1 })

    const appResolver = createResolver(nuxt.options.rootDir)
    const libraryCollections = options.includeLibraryCollections ? await getLibraryCollections(nuxt.options, appResolver) : []

    let previewComponent = appResolver.resolve(joinURL(options.dir, 'preview.vue'))
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

    nuxt.hooks.hookOnce('components:dirs', async (dirs) => {
      const collections = dirs.map((dir) => {
        const path = typeof dir === 'string' ? dir : dir.path
        return {
          ...typeof dir === 'string' ? {} : dir,
          path,
          name: 'Components',
          id: 'components'
        }
      }).filter(collection => !micromatch.isMatch(
        withTrailingSlash(collection.path),
        [compodiumComponentsDir, 'node_modules/**'],
        { contains: true })
      )

      const examplesDir = {
        path: appResolver.resolve(joinURL(options.dir, 'examples/')),
        pattern: '**/*.{vue,ts,tsx}'
      }

      const libraryExampleDirs = libraryCollections.map(c => ({
        path: resolve(c.examplePath),
        pattern: '**/*.{vue,ts,tsx}',
        prefix: c.prefix
      }))

      const exampleComponents = (await scanComponents([
        examplesDir,
        ...libraryExampleDirs
      ], nuxt.options.rootDir) ?? []).map(c => ({ ...c, isExample: true }))

      // dirs: [...dirs, examplesDir, ...libraryExampleDirs],
      addVitePlugin(CompodiumPlugin.vite({
        componentDirs: dirs,
        ...options
      }))
    })

    if (process.env.COMPODIUM_LOCAL === 'true') {
      const PORT = await getPort({ port: 42124 })

      nuxt.hooks.hookOnce('app:resolve', () => {
        startSubprocess(
          {
            command: 'pnpm',
            args: ['nuxi', 'dev'],
            cwd: './packages/devtools',
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
