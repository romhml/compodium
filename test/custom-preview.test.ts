import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('custom-preview', async () => {
  await setup({
    // FIXME: TypeError: The URL must be of scheme file
    // rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    rootDir: resolve('./test/fixtures/custom-preview'),
    dev: true
  })

  describe('renderer', () => {
    it('is mounted inside custom preview', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="custom-preview">')
    })
  })
})
