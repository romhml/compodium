import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection } from '~/src/types'

describe('custom collection', async () => {
  await setup({
    rootDir: resolve('./test/fixtures/custom-collection'),
    dev: true,
    env: {
      COMPODIUM_TEST: 'true'
    }
  })

  describe('collections api', () => {
    it('works', async () => {
      const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
      expect(collections).toEqual({
        'components': expect.objectContaining({
          name: 'Components',
          id: 'components',
          components: expect.objectContaining({
            basicComponent: expect.objectContaining({ componentId: 'basicComponent', collectionId: 'components' })
          })
        }),
        'my-ui': expect.objectContaining({
          name: 'MyUi',
          id: 'my-ui',
          components: expect.objectContaining({
            uButton: expect.objectContaining({ componentId: 'uButton' })
          })
        })
      })
    })

    // it('assigns component examples', async () => {
    //   const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
    //   expect(collections.components.components.basicComponent.examples).toEqual([
    //     expect.objectContaining({
    //       baseName: 'ComponentsBasicComponentExampleWithSuffix',
    //       collectionId: 'components',
    //       componentId: 'basicComponent',
    //       shortPath: 'compodium/components/BasicComponentExampleWithSuffix.vue',
    //       isExample: true,
    //       name: 'WithSuffix',
    //       pascalName: 'ComponentsBasicComponentExampleWithSuffix'
    //     })
    //   ])
    // })
    //
    // it('overrides component with main example', async () => {
    //   const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
    //   expect(collections.components.components.basicComponent).toEqual(expect.objectContaining({
    //     pascalName: 'ComponentsBasicComponentExample',
    //     shortPath: 'compodium/components/BasicComponentExample.vue',
    //     collectionId: 'components',
    //     componentId: 'basicComponent'
    //   }))
    // })
  })
})
