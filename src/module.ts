import { startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule, createResolver, installModule, addImportsDir, addTemplate } from '@nuxt/kit'
import defu from 'defu'
import { getPort } from 'get-port-please'
import sirv from 'sirv'
import { compodiumMetaPlugin } from './meta'

export interface ModuleOptions {
  placeholder: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'compodium',
    configKey: 'compodium',
  },
  defaults: {},
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addImportsDir(resolve('./runtime/composables'))

    if (nuxt.options.dev && nuxt.options.devtools.enabled) {
      await installModule('../../nuxt-component-meta/src/module')

      const appResolver = createResolver(nuxt.options.rootDir)
      nuxt.options.vite = defu(nuxt.options?.vite, { plugins: [compodiumMetaPlugin({ resolve: appResolver.resolve, options })] })

      nuxt.hook('app:resolve', (app) => {
        const root = app.rootComponent
        addTemplate({
          filename: 'compodium-root.mjs',
          getContents: () => `
            export { default } from "${root}"
          `,
        })
        app.rootComponent = resolve('./runtime/custom-root.vue')
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
                PORT: PORT.toString(),
              },
            },
            {
              id: 'compodium:devtools',
              name: 'Compodium Devtools',
            },
            nuxt,
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
            rewriteWsOrigin: true,
          }
        })
      }
      else {
        nuxt.hook('vite:serverCreated', async (server) => {
          server.middlewares.use('/__compodium__/devtools', sirv(resolve('../dist/client/devtools'), {
            single: true,
            dev: true,
          }))
        })
      }

      nuxt.options.routeRules = defu(nuxt.options.routeRules, { '/__compodium__/**': { ssr: false } })
    }
  },
})
