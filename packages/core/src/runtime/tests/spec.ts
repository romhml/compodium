import { describe, expect, inject, test } from 'vitest'
import { createCheckerByJson } from '@compodium/meta'
import type { ComponentCollection, PluginConfig } from '../../types'
import { h } from 'vue'

declare module 'vitest' {
  interface ProvidedContext {
    collections: ComponentCollection[]
    config: PluginConfig
    root: string
  }
}

function createChecker(dirs: any[]) {
  const rootDir = process.cwd()
  const metaChecker = createCheckerByJson(
    rootDir,
    {
      extends: `${rootDir}/tsconfig.json`,
      skipLibCheck: true,
      include: [
        '**/*',
        ...dirs?.map((dir: any) => {
          const path = typeof dir === 'string' ? dir : (dir?.path || '')
          if (path.endsWith('.vue')) {
            return path
          }
          return `${path}/**/*`
        }) ?? []
      ],
      exclude: []
    },
    {
      forceUseTs: true,
      schema: {
        ignore: [
          'NuxtComponentMetaNames',
          'RouteLocationRaw',
          'RouteLocationPathRaw',
          'RouteLocationNamedRaw'
        ]
      }
    }
  )

  const checker = {
    ...metaChecker,
    getComponentMeta: (componentPath: string) => {
      const meta = metaChecker.getComponentMeta(componentPath)
      return {
        compodium: meta.compodium
      }
    }
  }
  return checker
}

const collections = inject('collections')
const config = inject('config')

const checkerDirs = [
  ...config.componentCollection.dirs,
  config.componentCollection.exampleDir,
  ...config.libraryCollections.flatMap(c => c.dirs),
  ...config.libraryCollections.map(c => c.exampleDir)
]

const checker = createChecker(checkerDirs)

const mount = config._nuxt ? await import('@nuxt/test-utils/runtime').then(e => e.mountSuspended) : await import('@vue/test-utils').then(e => e.mount)

describe.skipIf(!config.tests || (typeof config.tests === 'object' && !config.tests?.snapshots))('Snapshots', () => {
  describe.each(collections.map(c => [c.name, c]))('%s', (_, col) => {
    describe.each(col.components.map(c => [c.pascalName, c]))('%s', (_, comp) => {
      // Read meta properties, render component and take snapshot
      test.each([comp, ...comp.examples ?? []].map(c => [c.pascalName, c]))('%s', async (_, example) => {
        const meta = checker.getComponentMeta(example.filePath)

        const component = await import(example.filePath).then(c => c.default)
        const wrapperComponent = col.wrapperComponent ? await import(col.wrapperComponent).then(c => c.default) : null

        const props = meta.compodium?.defaultProps

        const wrapper = wrapperComponent
          ? await mount(wrapperComponent, {
            slots: { default: () => h(component, { ...props }) }
          })
          : await mount(component, {
            props
          })

        expect(wrapper.html()).toMatchSnapshot()
      })
    })
  })
})
