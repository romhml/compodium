import { addCustomTab } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, addTemplate, addTypeTemplate, addVitePlugin, logger } from '@nuxt/kit'
import { colors } from 'consola/utils'
import { joinURL } from 'ufo'
import { resolve as resolvePath } from 'pathe'
import { version } from '../package.json'
import { defu } from 'defu'
import { compodium } from '@compodium/core'
import type { PluginOptions } from '@compodium/core'

export type ModuleOptions = Omit<PluginOptions, 'mainPath' | 'componentDirs' | 'rootDir' | '_nuxt' | '_rootDirs' | 'baseUrl' | 'tsconfigPath'>

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@compodium/nuxt',
    configKey: 'compodium'
  },
  defaults: {
    dir: 'compodium/',
    includeLibraryCollections: true
  },

  async setup(options, nuxt) {
    const { resolve, resolvePath: resolveModulePath } = createResolver(import.meta.url)

    const coreTypesEntry = await resolveModulePath('@compodium/core')

    addTypeTemplate({
      filename: 'types/compodium.d.ts',
      getContents: () => `import ${JSON.stringify(coreTypesEntry)}`
    })

    if (!nuxt.options.dev) return

    nuxt.hooks.hookOnce('app:resolve', (app) => {
      const rootComponent = app.rootComponent
      app.rootComponent = resolve('./runtime/nuxt-root.vue')

      addTemplate({
        filename: 'compodium/root.mjs',
        getContents: () => `export { default } from '${rootComponent}'`
      })
    })

    // Injects a placeholder page for the renderer to silence warnings if the router integration is enabled.
    nuxt.hooks.hookOnce('pages:extend', (pages) => {
      if (pages.length) pages.push({ path: '/__compodium__/renderer', file: resolve('./runtime/renderer-placeholder.vue') })
    })

    if (nuxt.options.experimental?.typedPages) {
      nuxt.options.routeRules = defu(nuxt.options.routeRules, { '/__compodium__/**': { ssr: false } })
    }

    nuxt.hooks.hookOnce('components:dirs', async (dirs) => {
      addVitePlugin(compodium({
        ...options,
        componentDirs: dirs,
        rootDir: nuxt.options.rootDir,
        _rootDirs: nuxt.options._layers.map(layer => layer.config.rootDir),
        tsconfigPath: resolvePath(nuxt.options.rootDir, nuxt.options.buildDir, 'tsconfig.app.json'),
        baseUrl: nuxt.options.app.baseURL,
        _nuxt: true
      }) as Parameters<typeof addVitePlugin>[0])
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

    nuxt.hook('listen', (_, listener) => {
      const compodiumUrl = joinURL(listener.url, '/__compodium__/devtools')
      console.log('')
      logger.log([
        colors.magenta(`  ➜ `),
        colors.bold(colors.magenta(`Compodium:`)),
        colors.dim(` available in`),
        colors.yellow(` DevTools`),
        colors.dim(` (v${version})`),
        colors.gray(`\n               or `),
        colors.underline(colors.dim(`${compodiumUrl}`)),
        '\n'
      ].join(''))
    })
  }
})
