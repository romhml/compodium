import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'
import { dirname } from 'pathe'

describe('prod', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/basic'))
  await setup({
    rootDir,
    dev: false
  })

  it('renderer is not injected in production', async () => {
    const html = await $fetch('/__compodium__/renderer')
    expect(html).not.toContain('<div id="compodium-renderer" class="compodium-component-renderer"><!----></div>')
    expect(html).toContain('<div>basic</div>')
  })
})
