import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('prod', async () => {
  await setup({
    rootDir: resolve('./test/fixtures/basic'),
    dev: false
  })

  it('renderer is not injected in production', async () => {
    const html = await $fetch('/__compodium__/renderer')
    expect(html).not.toContain('<div id="compodium-renderer" class="compodium-component-renderer"><!----></div>')
    expect(html).toContain('<div>basic</div>')
  })
})
