import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection } from '@compodium/core'

describe('custom compodium dir', async () => {
  await setup({
    rootDir: resolve('./test/fixtures/custom-compodium-dir'),
    dev: true
  })

  describe('renderer', () => {
    it('is mounted inside custom preview', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="custom-preview"')
    })
  })

  it('resolves examples', async () => {
    const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
    expect(collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Components',
          components: expect.arrayContaining([
            expect.objectContaining({
              pascalName: 'BasicComponentExample'
            })
          ])
        })
      ])
    )
  })
})
