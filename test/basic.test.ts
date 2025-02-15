import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('basic', async () => {
  await setup({
    // FIXME: TypeError: The URL must be of scheme file
    // rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    rootDir: resolve('./test/fixtures/basic'),
    dev: true
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })

  describe('renderer', () => {
    it('is mounted in development', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="compodium-default-preview">')
    })
  })
})
