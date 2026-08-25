import { fetch, setup } from '@nuxt/test-utils/e2e'
import { join } from 'pathe'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('metadata checker failure', async () => {
  const rootDir = fileURLToPath(new URL('./fixtures/meta-checker-failure', import.meta.url))

  await setup({
    rootDir,
    dev: true,
    port: 4546,
    setupTimeout: 30000
  })

  it('returns an error when component metadata initialization fails', async () => {
    const query = new URLSearchParams({
      component: join(rootDir, 'app/components/ExampleComponent.vue')
    })
    const response = await fetch(`/__compodium__/api/meta?${query}`)

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Metadata unavailable' })
  })
})
