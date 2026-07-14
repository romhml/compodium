import { afterAll, describe, expect, it, vi } from 'vitest'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'pathe'
import { createViteDevServer } from './utils'

function getHookHandler<T>(hook: T | { handler: T } | undefined): T | undefined {
  return typeof hook === 'object' && hook && 'handler' in hook ? hook.handler : hook
}

describe('compodium HMR ownership', async () => {
  const server = await createViteDevServer('./fixtures/hmr')
  const componentPath = resolve(server.config.root, 'src/components/HmrComponent.vue')
  const examplePath = resolve(server.config.root, 'compodium/examples/HmrComponentExampleVariant.vue')
  const componentRoot = resolve(server.config.root, 'src/components')
  const exampleRoot = resolve(server.config.root, 'compodium/examples')
  const originalComponent = await readFile(componentPath, 'utf8')
  const originalExample = await readFile(examplePath, 'utf8')
  const compodiumPlugins = server.config.plugins.filter(plugin => [
    'compodium:meta',
    'compodium:examples',
    'compodium:collections'
  ].includes(plugin.name))

  await server.watcher.unwatch([componentRoot, exampleRoot])

  async function closeCompodiumPlugins() {
    for (const plugin of compodiumPlugins) {
      const handler = getHookHandler(plugin.closeBundle)
      if (handler) await handler.call({} as never)
    }
  }

  afterAll(async () => {
    await writeFile(componentPath, originalComponent)
    await writeFile(examplePath, originalExample)
    await server.close()
  })

  it('owns structural notifications exactly once after invalidation', async () => {
    const collectionsId = (await server.pluginContainer.resolveId('virtual:compodium:collections'))!.id
    await server.transformRequest('/__compodium__/modules/collections')
    const collectionsModule = server.moduleGraph.getModuleById(collectionsId)!
    const invalidate = vi.spyOn(server.moduleGraph, 'invalidateModule')
    const send = vi.spyOn(server.ws, 'send')
    const addedPath = resolve(componentRoot, 'AddedComponent.vue')

    server.watcher.emit('add', addedPath)
    server.watcher.emit('unlink', addedPath)

    const events = send.mock.calls
      .map(([payload]) => payload)
      .filter((payload: any) => payload?.event === 'compodium:hmr')

    expect(events).toEqual([
      expect.objectContaining({ data: { path: addedPath, event: 'component:added' } }),
      expect.objectContaining({ data: { path: addedPath, event: 'component:removed' } })
    ])
    expect(invalidate).toHaveBeenCalledWith(collectionsModule)
    expect(invalidate.mock.invocationCallOrder[0]).toBeLessThan(send.mock.invocationCallOrder[0]!)
    invalidate.mockRestore()
    send.mockRestore()
  })

  it('updates state, invalidates affected modules, and preserves ordinary HMR', async () => {
    const collectionsId = (await server.pluginContainer.resolveId('virtual:compodium:collections'))!.id
    const metaRequest = `virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(examplePath)}`
    const metaId = (await server.pluginContainer.resolveId(metaRequest))!.id
    const exampleRequest = `virtual:compodium:example?path=${encodeURIComponent(examplePath)}`
    const exampleId = (await server.pluginContainer.resolveId(exampleRequest))!.id
    await server.transformRequest('/__compodium__/modules/collections')
    await server.transformRequest(`/__compodium__/modules/meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(examplePath)}`)
    await server.transformRequest(`/__compodium__/modules/example?path=${encodeURIComponent(examplePath)}`)
    await server.transformRequest('/src/components/HmrComponent.vue')
    await server.watcher.unwatch([componentPath, examplePath])

    const collectionsModule = server.moduleGraph.getModuleById(collectionsId)!
    const metaModule = server.moduleGraph.getModuleById(metaId)!
    const exampleModule = server.moduleGraph.getModuleById(exampleId)!
    const invalidate = vi.spyOn(server.moduleGraph, 'invalidateModule')
    const send = vi.spyOn(server.ws, 'send')

    await writeFile(componentPath, originalComponent.replace('label?: string', 'title?: string'))
    server.watcher.emit('change', componentPath)
    await vi.waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith(collectionsModule)
      expect(invalidate).toHaveBeenCalledWith(metaModule)
    })
    const refreshedMeta = await server.transformRequest(`/__compodium__/modules/meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(examplePath)}&t=${Date.now()}`)
    expect(refreshedMeta?.code).toContain('"name":"title"')
    expect(server.moduleGraph.getModulesByFile(componentPath)?.size).toBeGreaterThan(0)

    invalidate.mockClear()
    send.mockClear()
    await writeFile(examplePath, originalExample.replace('selected: false', 'selected: true').replace('<HmrComponent />', '<HmrComponent>changed</HmrComponent>'))
    server.watcher.emit('change', examplePath)
    await vi.waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith(collectionsModule)
      expect(invalidate).toHaveBeenCalledWith(metaModule)
      expect(invalidate).toHaveBeenCalledWith(exampleModule)
    })

    const changedEvents = send.mock.calls
      .map(([payload]) => payload)
      .filter((payload: any) => payload?.event === 'compodium:hmr')
    expect(changedEvents).toEqual([
      expect.objectContaining({ data: { path: examplePath, event: 'component:changed' } })
    ])
    const collectionInvalidation = invalidate.mock.calls.findIndex(([module]) => module === collectionsModule)
    const metadataInvalidation = invalidate.mock.calls.findIndex(([module]) => module === metaModule)
    const exampleInvalidation = invalidate.mock.calls.findIndex(([module]) => module === exampleModule)
    const customNotification = send.mock.calls.findIndex(call => (call[0] as any)?.event === 'compodium:hmr')
    expect(invalidate.mock.invocationCallOrder[collectionInvalidation]!).toBeLessThan(invalidate.mock.invocationCallOrder[metadataInvalidation]!)
    expect(invalidate.mock.invocationCallOrder[metadataInvalidation]!).toBeLessThan(invalidate.mock.invocationCallOrder[exampleInvalidation]!)
    expect(invalidate.mock.invocationCallOrder[exampleInvalidation]!).toBeLessThan(send.mock.invocationCallOrder[customNotification]!)

    const refreshedExample = await server.ssrLoadModule(`${exampleRequest}&t=${Date.now()}`)
    expect(refreshedExample.default).toContain('changed')
    const refreshedExampleMeta = await server.transformRequest(`/__compodium__/modules/meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(examplePath)}&t=${Date.now() + 1}`)
    expect(refreshedExampleMeta?.code).toContain('"selected":true')
    invalidate.mockRestore()
    send.mockRestore()
  })

  it('removes only Compodium listeners during teardown', async () => {
    const watcher = server.watcher
    const close = vi.spyOn(watcher, 'close')
    const listenerCounts = ['add', 'addDir', 'unlink', 'unlinkDir'].map(event => watcher.listenerCount(event))

    await closeCompodiumPlugins()

    expect(['add', 'addDir', 'unlink', 'unlinkDir'].map(event => watcher.listenerCount(event)))
      .toEqual(listenerCounts.map(count => count - 3))
    expect(close).not.toHaveBeenCalled()
    close.mockRestore()
  })
})
