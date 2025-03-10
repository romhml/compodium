import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection } from '~/src/types'

describe('custom compodium dir', async () => {
  await setup({
    // FIXME: TypeError: The URL must be of scheme file
    // rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    rootDir: resolve('./test/fixtures/custom-compodium-dir'),
    dev: true,
    env: {
      COMPODIUM_TEST: 'true'
    }
  })

  describe('renderer', () => {
    it('is mounted inside custom preview', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="custom-preview"')
    })
  })

  it('resolves examples', async () => {
    const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
    expect(collections.components.components.basicComponent).toEqual(expect.objectContaining({
      pascalName: 'BasicComponentExample',
      shortPath: 'play/examples/BasicComponentExample.vue',
      collectionId: 'components',
      componentId: 'basicComponent'
    }))
  })
})
