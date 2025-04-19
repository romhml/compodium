/// <reference types="vitest" />
import type { PluginConfig } from '../../types'
import { scanComponents } from '../utils'
import type { VitePlugin } from 'unplugin'
import { resolve, dirname } from 'pathe'
import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'

export function testPlugin(config: PluginConfig): VitePlugin {
  return {
    name: 'compodium:tests',
    enforce: 'post',
    async configureVitest({ project, injectTestProjects }) {
      if (!config.tests) return

      const collections = await Promise.all([config.componentCollection, ...config.libraryCollections].map(async (col) => {
        const components = await scanComponents(col.dirs, config.rootDir)
        const examples = await scanComponents([col.exampleDir], config.rootDir)

        const collectionComponents = components.map((c) => {
          const componentExamples = examples?.filter(e => e.pascalName.startsWith(`${c.pascalName}Example`)).map(e => ({
            ...e,
            filePath: resolve(config.rootDir, e.filePath),
            isExample: true,
            componentPath: resolve(config.rootDir, c.filePath)
          }))

          const mainExample = componentExamples.find(e => e.pascalName === `${c.pascalName}Example`)
          const component = mainExample ?? c

          return {
            ...component,
            filePath: resolve(config.rootDir, component.filePath),
            wrapperComponent: col.wrapperComponent,
            docUrl: col.getDocUrl?.(c.pascalName),
            examples: componentExamples.filter(e => e.pascalName !== mainExample?.pascalName)
          }
        })

        return {
          ...col,
          components: collectionComponents
        }
      }))

      await injectTestProjects({
        extends: project.vite.config.configFile,

        test: {
          name: 'compodium',
          include: [fileURLToPath(joinURL(dirname(import.meta.url), './spec.ts'))],

          snapshotEnvironment: fileURLToPath(joinURL(dirname(import.meta.url), './snapshots.ts')),

          provide: {
            config: JSON.parse(JSON.stringify(config)),
            collections: JSON.parse(JSON.stringify(collections)),
            root: joinURL(project.vite.config.root, config.dir)
          },

          globals: true,
          environment: 'happy-dom',
          root: joinURL(project.vite.config.root, config.dir),

          server: {
            deps: {
              inline: ['@nuxt/ui']
            }
          }
        }
      })
    }
  }
}
