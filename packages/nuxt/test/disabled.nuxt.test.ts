import { dirname } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch, url } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'

describe('disabled module', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/disabled'))

  await setup({
    rootDir,
    dev: true,
    setupTimeout: 30000
  })

  it('renders the app', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<div>disabled</div>')
  })

  it('does not mount the renderer', async () => {
    const response = await fetch(url('/__compodium__/renderer'))
    expect(await response.text()).not.toContain('compodium-default-preview')
  })

  it('does not install the API', async () => {
    const response = await fetch(url('/__compodium__/api/collections'))
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).not.toContain('pascalName')
  })
})
