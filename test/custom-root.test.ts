import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('custom-root', async () => {
  await setup({
    // FIXME: TypeError: The URL must be of scheme file
    // rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    rootDir: resolve('./test/fixtures/custom-root'),
    dev: true
  })

  describe('renderer', () => {
    it('is mounted inside custom root', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="custom-root"><!--[--><div id="compodium-renderer" class="compodium-component-renderer"><!----></div><!--]--></div>')
    })
  })
})
