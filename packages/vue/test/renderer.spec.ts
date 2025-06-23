import { describe, expect, it } from 'vitest'
import { createViteServer } from './utils'

describe('renderer', async () => {
  const server = await createViteServer('./fixtures/basic')

  it('is mounted in development', async () => {
    const resp = await server.get('/__compodium__/renderer')
    expect(resp.text).toContain('<script type="module" src="/@compodium/renderer.ts"></script>')
  })

  it('extends users app', async () => {
    const resp = await server.get('/@compodium/renderer.ts')
    expect(resp.text).toContain('app.mount("#compodium")')
  })

  describe('with base', async () => {
    const server = await createViteServer('./fixtures/basic', { base: '/foo' })

    it('is mounted in development', async () => {
      const resp = await server.get('/__compodium__/renderer')
      expect(resp.text).toContain('<script type="module" src="/foo/@compodium/renderer.ts"></script>')
    })

    it('resolves correctly', async () => {
      const resp = await server.get('/foo/@compodium/renderer.ts')
      expect(resp.text).toContain('app.mount("#compodium")')
    })
  })
})
