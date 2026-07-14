import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'

import { createViteDevServer } from './utils'

describe('collections module', async () => {
  const viteServer = await createViteDevServer('./fixtures/basic')
  const server = request(viteServer.middlewares)
  const collections = (await viteServer.ssrLoadModule('virtual:compodium:collections')).default

  afterAll(async () => {
    await viteServer.close()
  })

  it('works', async () => {
    expect(collections).toContainComponent({
      pascalName: 'BasicComponent'
    })
  })

  it('includes component examples', async () => {
    expect(collections).toContainComponent({
      pascalName: 'BasicComponent',
      examples: [
        expect.objectContaining({ pascalName: 'BasicComponentExampleWithFoo' })
      ]
    })
  })

  it('does not merge component defaultProps into examples that define defaultProps', async () => {
    expect(collections).toContainComponent({
      pascalName: 'BasicComponent',
      examples: [
        expect.objectContaining({
          pascalName: 'BasicComponentExampleWithFoo',
          defaultProps: { exampleDefault: true }
        })
      ]
    })
  })

  it('replace component with main example', async () => {
    expect(collections).toContainComponent({
      pascalName: 'TestComponentExample',
      examples: [
        expect.objectContaining({ pascalName: 'TestComponentExampleWithFoo' })
      ]
    })
  })

  it('serves the browser module with the public module projection', async () => {
    const moduleResponse = await server.get('/__compodium__/modules/collections')

    expect(moduleResponse.headers['content-type']).toMatch(/javascript/)
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(moduleResponse.text).toString('base64')}`
    const collectionsModule = await import(moduleUrl)
    expect(collectionsModule.default).toEqual(collections)
  })

  it('loads the public virtual module id through Vite', async () => {
    const collectionsModule = await viteServer.ssrLoadModule('virtual:compodium:collections')

    expect(collectionsModule.default).toEqual(collections)
  })

  it('canonicalizes collection revisions to the invalidated module identity', async () => {
    const queryless = await viteServer.pluginContainer.resolveId('virtual:compodium:collections')
    const firstRevision = await viteServer.pluginContainer.resolveId('/__compodium__/modules/collections?t=1752500000000')
    const secondRevision = await viteServer.pluginContainer.resolveId('/__compodium__/modules/collections?t=1752500000001')

    expect(firstRevision?.id).toBe(queryless?.id)
    expect(secondRevision?.id).toBe(queryless?.id)

    await viteServer.transformRequest('/__compodium__/modules/collections?t=1752500000000')
    const canonicalModule = viteServer.moduleGraph.getModuleById(queryless!.id)
    expect(canonicalModule).toBeDefined()
    expect(viteServer.moduleGraph.getModuleById(firstRevision!.id)).toBe(canonicalModule)
    expect(viteServer.moduleGraph.getModuleById(secondRevision!.id)).toBe(canonicalModule)
  })

  it('serves the browser alias when Vite has a non-root base', async () => {
    const basedViteServer = await createViteDevServer('./fixtures/basic', { base: '/docs/' })

    try {
      const moduleResponse = await request(basedViteServer.middlewares)
        .get('/__compodium__/modules/collections?t=1752500000000')

      expect(moduleResponse.status).toBe(200)
      expect(moduleResponse.headers['content-type']).toMatch(/javascript/)
      const moduleUrl = `data:text/javascript;base64,${Buffer.from(moduleResponse.text).toString('base64')}`
      const collectionsModule = await import(moduleUrl)
      expect(collectionsModule.default).toEqual(collections)
    } finally {
      await basedViteServer.close()
    }
  })

  it('closes the Vite server and plugin watchers cleanly', async () => {
    const closingViteServer = await createViteDevServer('./fixtures/basic', {
      server: { hmr: false }
    })

    await expect(closingViteServer.close()).resolves.toBeUndefined()
  })
})
