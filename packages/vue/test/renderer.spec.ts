import { describe, expect, it } from 'vitest'
import { createViteServer } from './utils'
import { inferMainPath, renderRendererIndex, transformMainModule } from '../src/plugins/renderer'

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

  it('handles unquoted attributes and greater-than signs in other attributes', () => {
    expect(inferMainPath(`
      <html><body data-label="a > b">
        <script type=module src=/src/main.ts></script>
      </body></html>
    `)).toBe('./src/main.ts')
  })

  it('handles case-insensitive HTML tags and attributes', () => {
    expect(inferMainPath('<HTML><BODY><SCRIPT SRC=/src/main.ts></SCRIPT></BODY></HTML>')).toBe('./src/main.ts')
  })
})

describe('renderRendererIndex', () => {
  it('replaces the parsed body instead of body-like text in scripts', () => {
    const result = renderRendererIndex(`<!DOCTYPE html>
<html><head><script>const fake = '<body>keep</body>'</script></head>
<body class="app"><div id="app" /></body></html>`, '/base')

    expect(result).toContain(`const fake = '<body>keep</body>'`)
    expect(result).toContain('<body>\n              <div id="compodium"></div>')
    expect(result).toContain('src="/base/@compodium/renderer.ts"')
    expect(result).not.toContain('class="app"')
  })
})

describe('transformMainModule', () => {
  it('rewrites AST-selected calls and static relative module sources', async () => {
    const source = `import { createApp as makeApp } from 'vue'
import App from './App.vue'
import './style.css'
export { helper } from '../shared.ts'
const note = '😀 createApp(fake).mount(fake)'
const app = makeApp(createRoot({ nested: true }))
app.mount(getTarget('#app'))
`

    const result = await transformMainModule('/project/src/main.ts', source)

    expect(result).toContain('makeApp(CompodiumRoot)')
    expect(result).toContain('app.mount("#compodium")')
    expect(result).toContain('from "/project/src/App.vue"')
    expect(result).toContain('import "/project/src/style.css"')
    expect(result).toContain('from "/project/shared.ts"')
    expect(result).toContain(`'😀 createApp(fake).mount(fake)'`)
  })

  it('supports chained createApp and mount calls without overlapping edits', async () => {
    const result = await transformMainModule('/project/main.ts', `import { createApp } from 'vue'
createApp(makeRoot()).mount(resolveTarget())`)

    expect(result).toContain('createApp(CompodiumRoot).mount("#compodium")')
  })

  it('does not apply an overlapping edit to a mount call inside createApp arguments', async () => {
    const result = await transformMainModule('/project/main.ts', `import { createApp } from 'vue'
createApp(foo.mount(getTarget()))`)

    expect(result).toContain('createApp(CompodiumRoot)')
    expect(result).not.toContain('))')
  })

  it('does not rewrite unrelated mount calls', async () => {
    const result = await transformMainModule('/project/main.ts', `import { createApp } from 'vue'
other.mount('#other')
const root = createApp(App)
root.mount('#app')`)

    expect(result).toContain(`other.mount('#other')`)
    expect(result).toContain('root.mount("#compodium")')
  })
})
