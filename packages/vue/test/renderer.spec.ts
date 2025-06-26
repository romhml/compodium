import { describe, expect, it } from 'vitest'
import { createViteServer } from './utils'
import { inferMainPath } from '../src/plugins/renderer'

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

describe('inferMainPath', async () => {
  it('works', async () => {
    expect(inferMainPath(`
      <!DOCTYPE html>
      <html lang="">
        <head>
          <meta charset="UTF-8">
          <link rel="icon" href="/favicon.ico">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Compodium Playground</title>
        </head>
        <body>
          <div id="app"></div>
          <script src="/src/main.ts"></script>
        </body>
      </html>
  `)).toBe('./src/main.ts')
  })

  it('ignores remote scripts', async () => {
    expect(inferMainPath(`
      <!DOCTYPE html>
      <html lang="">
        <body>
          <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
        </body>
      </html>
    `)).toBe(undefined)
  })

  it('returns first match', async () => {
    expect(inferMainPath(`
      <!DOCTYPE html>
      <html lang="">
        <body>
          <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
          <script src="/src/main.ts"></script>
          <script src="/src/main.js"></script>
        </body>
      </html>
  `)).toBe('./src/main.ts')
  })
})
