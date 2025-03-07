import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('custom components dirs', async () => {
  await setup({
    rootDir: resolve('./test/fixtures/custom-component-dirs'),
    dev: true,
    env: {
      COMPODIUM_TEST: 'true'
    }
  })

  describe('collections api', () => {
    it('works', async () => {
      const collections = await $fetch('/__compodium__/api/collections')
      expect(collections).toEqual({
        components: expect.objectContaining({
          name: 'Components',
          id: 'components',
          components: expect.objectContaining({
            basicComponent: expect.objectContaining({ componentId: 'basicComponent', collectionId: 'components' }),
            uButton: expect.objectContaining({ componentId: 'uButton' })
          })
        })
      })
    })

    describe('collections api', () => {
      it('resolves examples', async () => {
        const collections = await $fetch('/__compodium__/api/collections')
        expect(collections.components.components.basicComponent).toEqual(expect.objectContaining({
          pascalName: 'BasicComponentExample',
          shortPath: 'compodium/examples/BasicComponentExample.vue',
          collectionId: 'components',
          componentId: 'basicComponent'
        }))
      })
    })
  })
})
