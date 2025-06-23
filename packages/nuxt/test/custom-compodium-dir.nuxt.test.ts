import { dirname } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection } from '@compodium/core'
import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'

describe('custom compodium dir', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/custom-compodium-dir'))

  await setup({
    rootDir,
    dev: true,
    setupTimeout: 30000
  })

  describe('renderer', () => {
    it('is mounted inside custom preview', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="custom-preview"')
    })
  })

  it('resolves examples', async () => {
    const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
    expect(collections).toContainComponent({
      pascalName: 'BasicComponentExample'
    })
  })
})
