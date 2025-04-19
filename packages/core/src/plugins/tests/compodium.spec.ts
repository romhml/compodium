import { describe, expect, inject, test } from 'vitest'
import { mount } from '@vue/test-utils'
import { createChecker } from '../meta/checker'
import type { ComponentCollection, PluginConfig } from '../../types'
import { h } from 'vue'

describe('Compodium', () => {
  const collections: ComponentCollection[] = inject('collections')
  const config: PluginConfig = inject('config')

  const checkerDirs = [
    ...config.componentCollection.dirs,
    config.componentCollection.exampleDir,
    ...config.libraryCollections.flatMap(c => c.dirs),
    ...config.libraryCollections.map(c => c.exampleDir)
  ]

  const checker = createChecker(checkerDirs)

  describe.each(collections.map(c => [c.name, c]))('%s', (_, col) => {
    describe.each(col.components.map(c => [c.pascalName, c]))('%s', (_, comp) => {
      // Read meta properties, render component and take snapshot
      test.each([comp, ...comp.examples ?? []].map(c => [c.pascalName, c]))('%s', async (_, example) => {
        const meta = checker.getComponentMeta(example.filePath)

        const component = await import(example.filePath).then(c => c.default)
        const wrapperComponent = col.wrapperComponent ? await import(col.wrapperComponent).then(c => c.default) : null

        const props = meta.compodium?.defaultProps

        const wrapper = wrapperComponent
          ? mount(wrapperComponent, {
              slots: { default: () => h(component, { ...props }) }
            })
          : mount(component, {
              props
            })

        expect(wrapper.html()).toMatchSnapshot()
      })
    })
  })
})
