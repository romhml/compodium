import { afterAll, describe, expect, it, vi } from 'vitest'
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { resolve } from 'pathe'
import { createViteDevServer } from './utils'

describe('compodium HMR ownership', async () => {
  const server = await createViteDevServer('./fixtures/hmr', {
    server: { hmr: true, ws: false }
  })
  const componentPath = resolve(server.config.root, 'src/components/HmrComponent.vue')
  const examplePath = resolve(server.config.root, 'compodium/examples/HmrComponentExampleVariant.vue')
  const componentRoot = resolve(server.config.root, 'src/components')
  const exampleRoot = resolve(server.config.root, 'compodium/examples')
  const originalComponent = await readFile(componentPath, 'utf8')
  const originalExample = await readFile(examplePath, 'utf8')

  server.watcher.unwatch([componentRoot, exampleRoot])

  afterAll(async () => {
    await writeFile(componentPath, originalComponent)
    await writeFile(examplePath, originalExample)
    await server.close()
  })

  it('owns structural notifications exactly once after invalidation', async () => {
    const collectionsId = (await server.pluginContainer.resolveId('virtual:compodium:collections'))!.id
    await server.transformRequest('virtual:compodium:collections')
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
    await server.transformRequest('virtual:compodium:collections')
    await server.transformRequest(metaRequest)
    await server.transformRequest(exampleRequest)
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
    const refreshedMetaRequest = `${metaRequest}&t=${Date.now()}`
    await server.pluginContainer.resolveId(refreshedMetaRequest)
    const refreshedMeta = await server.transformRequest(refreshedMetaRequest)
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
    const refreshedExampleMetaRequest = `${metaRequest}&t=${Date.now() + 1}`
    await server.pluginContainer.resolveId(refreshedExampleMetaRequest)
    const refreshedExampleMeta = await server.transformRequest(refreshedExampleMetaRequest)
    expect(refreshedExampleMeta?.code).toContain('"selected":true')
    invalidate.mockRestore()
    send.mockRestore()
  })

  it('invalidates and unregisters removed example modules', async () => {
    const exampleRequest = `virtual:compodium:example?path=${encodeURIComponent(examplePath)}`
    const exampleId = (await server.pluginContainer.resolveId(exampleRequest))!.id
    await server.transformRequest(exampleRequest)
    const exampleModule = server.moduleGraph.getModuleById(exampleId)!
    const invalidate = vi.spyOn(server.moduleGraph, 'invalidateModule')

    server.watcher.emit('unlink', examplePath)
    expect(invalidate).toHaveBeenCalledWith(exampleModule)

    invalidate.mockClear()
    server.watcher.emit('unlink', examplePath)
    expect(invalidate.mock.calls.some(([module]) => module === exampleModule)).toBe(false)
    invalidate.mockRestore()
  })

  it('unregisters a canonical example when its lexical symlink is removed', async () => {
    const fixtureDir = resolve(exampleRoot, 'symlink-file-fixture')
    const targetPath = resolve(fixtureDir, 'TargetExample.vue')
    const lexicalPath = resolve(fixtureDir, 'AliasExample.vue')
    await rm(fixtureDir, { recursive: true, force: true })

    try {
      await mkdir(fixtureDir, { recursive: true })
      await writeFile(targetPath, '<template><div>symlink file</div></template>\n')
      await symlink('TargetExample.vue', lexicalPath)

      const exampleRequest = `virtual:compodium:example?path=${encodeURIComponent(lexicalPath)}`
      const exampleId = (await server.pluginContainer.resolveId(exampleRequest))!.id
      await server.transformRequest(exampleRequest)
      const exampleModule = server.moduleGraph.getModuleById(exampleId)!
      const invalidate = vi.spyOn(server.moduleGraph, 'invalidateModule')

      await rm(lexicalPath)
      server.watcher.emit('unlink', lexicalPath)
      expect(invalidate).toHaveBeenCalledWith(exampleModule)
      expect(await server.pluginContainer.load(exampleId)).toBeNull()

      invalidate.mockClear()
      server.watcher.emit('unlink', targetPath)
      expect(invalidate).not.toHaveBeenCalledWith(exampleModule)
      invalidate.mockRestore()
    } finally {
      await rm(fixtureDir, { recursive: true, force: true })
    }
  })

  it('cleans registrations beneath a symlinked configured example root on unlinkDir', async () => {
    const physicalRoot = resolve(server.config.root, 'symlink-root-target')
    const lexicalCompodiumDir = resolve(server.config.root, 'symlink-root-compodium')
    const lexicalRoot = resolve(lexicalCompodiumDir, 'examples')
    const physicalDirectory = resolve(physicalRoot, 'nested')
    const physicalPath = resolve(physicalDirectory, 'NestedExample.vue')
    const lexicalDirectory = resolve(lexicalRoot, 'nested')
    const lexicalPath = resolve(lexicalDirectory, 'NestedExample.vue')
    await rm(physicalRoot, { recursive: true, force: true })
    await rm(lexicalCompodiumDir, { recursive: true, force: true })

    let symlinkRootServer: Awaited<ReturnType<typeof createViteDevServer>> | undefined
    try {
      await mkdir(physicalDirectory, { recursive: true })
      await writeFile(physicalPath, '<template><div>symlink root</div></template>\n')
      await mkdir(lexicalCompodiumDir, { recursive: true })
      await symlink(physicalRoot, lexicalRoot)
      symlinkRootServer = await createViteDevServer('./fixtures/hmr', undefined, {
        dir: './symlink-root-compodium',
        includeLibraryCollections: false
      })

      const exampleRequest = `virtual:compodium:example?path=${encodeURIComponent(lexicalPath)}`
      const exampleId = (await symlinkRootServer.pluginContainer.resolveId(exampleRequest))!.id
      await symlinkRootServer.transformRequest(exampleRequest)
      const exampleModule = symlinkRootServer.moduleGraph.getModuleById(exampleId)!
      const invalidate = vi.spyOn(symlinkRootServer.moduleGraph, 'invalidateModule')

      await rm(physicalDirectory, { recursive: true })
      symlinkRootServer.watcher.emit('unlinkDir', lexicalDirectory)
      expect(invalidate).toHaveBeenCalledWith(exampleModule)
      expect(await symlinkRootServer.pluginContainer.load(exampleId)).toBeNull()

      invalidate.mockClear()
      symlinkRootServer.watcher.emit('unlinkDir', physicalDirectory)
      expect(invalidate).not.toHaveBeenCalledWith(exampleModule)
      invalidate.mockRestore()
    } finally {
      await symlinkRootServer?.close()
      await rm(lexicalCompodiumDir, { recursive: true, force: true })
      await rm(physicalRoot, { recursive: true, force: true })
    }
  })
})
