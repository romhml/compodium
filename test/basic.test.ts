import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    // FIXME: TypeError: The URL must be of scheme file
    // rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    rootDir: resolve('./test/fixtures/basic'),
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })

  // FIXME: Allow the renderer to render correctly in tests
  describe.skip('renderer', () => {
    it('renders basic component', async () => {
      const page = await createPage('/__compodium__/renderer?name=BasicTest')
      expect(await page.getByTestId('basic').isVisible()).toBe(true)
    })
  })
})
