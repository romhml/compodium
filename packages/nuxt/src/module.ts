import { addCustomTab } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, addTemplate, addVitePlugin, logger } from '@nuxt/kit'
import { colors } from 'consola/utils'
import { joinURL } from 'ufo'
import { version } from '../package.json'
import { defu } from 'defu'
import { compodium } from '@compodium/core'
import type { PluginOptions } from '@compodium/core'

export type ModuleOptions = Omit<PluginOptions, 'mainPath' | 'componentDirs' | 'rootDir' | '_nuxt' | 'baseUrl'>

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
    if (!nuxt.options.dev) return

    const { resolve } = createResolver(import.meta.url)

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
        componentDirs: dirs,
        rootDir: nuxt.options.rootDir,
        baseUrl: nuxt.options.app.baseURL,
        _nuxt: true,
        ...options
      }))
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
