import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { resolve } from 'pathe'
import { createViteDevServer } from './utils'

async function importModuleResponse(source: string) {
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  return await import(moduleUrl) as { default: unknown }
}

describe('project data modules', async () => {
  const viteServer = await createViteDevServer('./fixtures/basic', undefined, {
    extras: { colors: { primary: 'red', neutral: 'slate' } }
  })
  const server = request(viteServer.middlewares)
  const componentPath = resolve(viteServer.config.root, 'src/components/BasicComponent.vue')
  const examplePath = resolve(viteServer.config.root, 'compodium/examples/BasicComponentExampleWithFoo.vue')

  afterAll(async () => {
    await viteServer.close()
  })

  it('serves metadata with alias and public ID parity', async () => {
    const moduleResponse = await server.get('/__compodium__/modules/meta').query({ component: componentPath, t: 1752500000000 })
    const browserModule = await importModuleResponse(moduleResponse.text)
    const publicModule = await viteServer.ssrLoadModule(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&t=1752500000001`)

    expect(moduleResponse.status).toBe(200)
    expect(moduleResponse.headers['content-type']).toMatch(/javascript/)
    expect(browserModule.default).toEqual(publicModule.default)
    expect(browserModule.default).toEqual(expect.objectContaining({ props: expect.any(Array), events: expect.any(Array) }))
    expect(browserModule.default).toEqual(expect.objectContaining({
      compodium: {
        defaultProps: { componentDefault: true },
        combo: ['componentDefault']
      }
    }))
  })

  it('uses component checker metadata with selected example Compodium metadata', async () => {
    const query = {
      component: componentPath,
      macro: examplePath,
      t: 1752500000000
    }
    const moduleResponse = await server.get('/__compodium__/modules/meta').query(query)
    const browserModule = await importModuleResponse(moduleResponse.text)
    const publicModule = await viteServer.ssrLoadModule(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(examplePath)}&t=1752500000001`)

    expect(moduleResponse.status).toBe(200)
    expect(browserModule.default).toEqual(publicModule.default)
    expect(browserModule.default).toEqual(expect.objectContaining({
      props: expect.arrayContaining([expect.objectContaining({ name: 'foo' })]),
      events: expect.any(Array),
      compodium: {
        defaultProps: { exampleDefault: true },
        combo: ['exampleDefault']
      }
    }))
    expect((browserModule.default as { compodium: { defaultProps: Record<string, unknown> } }).compodium.defaultProps).not.toHaveProperty('componentDefault')
  })

  it('serves transformed example source with alias and public ID parity', async () => {
    const moduleResponse = await server.get('/__compodium__/modules/example').query({ path: examplePath, t: 1752500000000 })
    const browserModule = await importModuleResponse(moduleResponse.text)
    const publicModule = await viteServer.ssrLoadModule(`virtual:compodium:example?path=${encodeURIComponent(examplePath)}&t=1752500000001`)

    expect(moduleResponse.status).toBe(200)
    expect(moduleResponse.headers['content-type']).toMatch(/javascript/)
    expect(typeof browserModule.default).toBe('string')
    expect(browserModule.default).toBe(publicModule.default)
    expect(browserModule.default).not.toContain('extendCompodiumMeta')
  })

  it('serves colors with alias and public ID parity', async () => {
    const moduleResponse = await server.get('/__compodium__/modules/colors?t=1752500000000')
    const browserModule = await importModuleResponse(moduleResponse.text)
    const publicModule = await viteServer.ssrLoadModule('virtual:compodium:colors?t=1752500000001')

    expect(moduleResponse.status).toBe(200)
    expect(moduleResponse.headers['content-type']).toMatch(/javascript/)
    expect(browserModule.default).toEqual({ primary: 'red', neutral: 'slate' })
    expect(publicModule.default).toEqual(browserModule.default)
  })

  it('uses query-specific canonical IDs without browser timestamps', async () => {
    const firstMeta = await viteServer.pluginContainer.resolveId(`/__compodium__/modules/meta?component=${encodeURIComponent(componentPath)}&t=1752500000000`)
    const secondMeta = await viteServer.pluginContainer.resolveId(`/__compodium__/modules/meta?component=${encodeURIComponent(componentPath)}&t=1752500000001`)
    const selectedExampleMeta = await viteServer.pluginContainer.resolveId(`/__compodium__/modules/meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(examplePath)}&t=1752500000001`)
    const firstExample = await viteServer.pluginContainer.resolveId(`/__compodium__/modules/example?path=${encodeURIComponent(examplePath)}&t=1752500000000`)
    const secondExample = await viteServer.pluginContainer.resolveId(`/__compodium__/modules/example?path=${encodeURIComponent(examplePath)}&t=1752500000001`)

    expect(firstMeta?.id).toBe(secondMeta?.id)
    expect(firstMeta?.id).toContain('?component=')
    expect(firstMeta?.id).toContain('&macro=')
    expect(firstMeta?.id).not.toContain('&t=')
    expect(selectedExampleMeta?.id).not.toBe(firstMeta?.id)
    expect(selectedExampleMeta?.id).not.toContain('&t=')
    expect(firstExample?.id).toBe(secondExample?.id)
    expect(firstExample?.id).toContain('?path=')
    expect(firstExample?.id).not.toContain('&t=')
  })

  it('rejects missing, traversal, sibling-prefix, and out-of-root metadata paths', async () => {
    const traversalPath = resolve(viteServer.config.root, 'src/components') + '/../components/BasicComponent.vue'
    const siblingPrefixPath = resolve(viteServer.config.root, 'src/components-sibling/UnknownComponent.vue')
    const outOfRootPath = resolve(viteServer.config.root, 'src/App.vue')

    expect((await server.get('/__compodium__/modules/meta?t=1752500000000')).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/meta').query({ component: traversalPath, t: 1752500000000 })).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/meta').query({ component: outOfRootPath, t: 1752500000000 })).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/meta').query({ component: siblingPrefixPath, t: 1752500000000 })).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/meta').query({ component: componentPath, macro: traversalPath, t: 1752500000000 })).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/meta').query({ component: componentPath, macro: outOfRootPath, t: 1752500000000 })).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/meta').query({ component: componentPath, macro: siblingPrefixPath, t: 1752500000000 })).status).not.toBe(200)
  })

  it('rejects missing, traversal, out-of-root, and unknown example paths', async () => {
    const traversalPath = resolve(viteServer.config.root, 'compodium/examples') + '/../examples/BasicComponentExampleWithFoo.vue'
    const unknownPath = resolve(viteServer.config.root, 'src/App.vue')
    const siblingPrefixPath = resolve(viteServer.config.root, 'compodium/examples-sibling/UnknownExample.vue')

    expect((await server.get('/__compodium__/modules/example?t=1752500000000')).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/example').query({ path: traversalPath, t: 1752500000000 })).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/example').query({ path: '/tmp/compodium-out-of-root.vue', t: 1752500000000 })).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/example').query({ path: unknownPath, t: 1752500000000 })).status).not.toBe(200)
    expect((await server.get('/__compodium__/modules/example').query({ path: siblingPrefixPath, t: 1752500000000 })).status).not.toBe(200)
  })

  it('serves all browser aliases with a non-root Vite base', async () => {
    const basedViteServer = await createViteDevServer('./fixtures/basic', { base: '/docs/' }, {
      extras: { colors: { primary: 'red' } }
    })
    const basedServer = request(basedViteServer.middlewares)
    const basedComponentPath = resolve(basedViteServer.config.root, 'src/components/BasicComponent.vue')
    const basedExamplePath = resolve(basedViteServer.config.root, 'compodium/examples/BasicComponentExampleWithFoo.vue')

    try {
      const responses = await Promise.all([
        basedServer.get('/__compodium__/modules/meta').query({ component: basedComponentPath, t: 1752500000000 }),
        basedServer.get('/__compodium__/modules/example').query({ path: basedExamplePath, t: 1752500000000 }),
        basedServer.get('/__compodium__/modules/colors?t=1752500000000')
      ])

      for (const response of responses) {
        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toMatch(/javascript/)
      }
    } finally {
      await basedViteServer.close()
    }
  })
})
