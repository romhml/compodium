import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection } from '@compodium/core'

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
      const collections = await $fetch<ComponentCollection[]>('/__compodium__/api/collections')
      expect(collections).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Components',
            components: expect.arrayContaining([
              expect.objectContaining({
                pascalName: 'BasicComponentExample'
              }),
              expect.objectContaining({
                pascalName: 'UButton'
              })
            ])
          })
        ])
      )
    })
  })
})
