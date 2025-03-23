import { dirname } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection } from '@compodium/core'
import { joinURL } from 'ufo'
import { fileURLToPath } from 'node:url'

describe('custom components dirs', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/custom-component-dirs'))
  await setup({
    rootDir,
    dev: true
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
