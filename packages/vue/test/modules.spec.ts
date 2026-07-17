import { afterAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { resolve } from 'pathe'
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises'
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
  const macroFreeExamplePath = resolve(viteServer.config.root, 'compodium/examples/MacroFreeExample.vue')

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

  it('inherits component Compodium metadata when the selected example has no macro', async () => {
    const moduleResponse = await server.get('/__compodium__/modules/meta').query({
      component: componentPath,
      macro: macroFreeExamplePath,
      t: 1752500000000
    })
    const browserModule = await importModuleResponse(moduleResponse.text)

    expect(moduleResponse.status).toBe(200)
    expect(browserModule.default).toEqual(expect.objectContaining({
      props: expect.arrayContaining([expect.objectContaining({ name: 'foo' })]),
      events: expect.any(Array),
      compodium: {
        defaultProps: { componentDefault: true },
        combo: ['componentDefault']
      }
    }))
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

  it('preserves metadata and example semantic queries after import normalization', async () => {
    const metadataResponse = await server
      .get('/__compodium__/modules/meta?import')
      .query({ component: componentPath, macro: examplePath, t: 1752500000000 })
    const exampleResponse = await server
      .get('/__compodium__/modules/example?import')
      .query({ path: examplePath, t: 1752500000000 })

    expect(metadataResponse.status).toBe(200)
    expect(exampleResponse.status).toBe(200)
    expect((await importModuleResponse(metadataResponse.text)).default).toEqual(expect.objectContaining({
      compodium: { defaultProps: { exampleDefault: true }, combo: ['exampleDefault'] }
    }))
    expect((await importModuleResponse(exampleResponse.text)).default).toBeTypeOf('string')

    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&unknown=value`))
      .rejects.toThrow('Unsupported Compodium metadata module query')
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(examplePath)}&unknown=value`))
      .rejects.toThrow('Unsupported Compodium example module query')
  })

  it('serves colors with alias and public ID parity', async () => {
    const moduleResponse = await server.get('/__compodium__/modules/colors?import&t=1752500000000')
    const browserModule = await importModuleResponse(moduleResponse.text)
    const publicModule = await viteServer.ssrLoadModule('virtual:compodium:colors?t=1752500000001')

    expect(moduleResponse.status).toBe(200)
    expect(moduleResponse.headers['content-type']).toMatch(/javascript/)
    expect(browserModule.default).toEqual({ primary: 'red', neutral: 'slate' })
    expect(publicModule.default).toEqual(browserModule.default)
  })

  it('uses query-specific canonical IDs without browser timestamps', async () => {
    const firstMeta = await viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&t=1752500000000`)
    const secondMeta = await viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&t=1752500000001`)
    const selectedExampleMeta = await viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(examplePath)}&t=1752500000001`)
    const firstExample = await viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(examplePath)}&t=1752500000000`)
    const secondExample = await viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(examplePath)}&t=1752500000001`)

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

    await expect(viteServer.pluginContainer.resolveId('virtual:compodium:meta?t=1752500000000'))
      .rejects.toThrow('Compodium metadata module requires a component path')
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(traversalPath)}`))
      .rejects.toThrow(`Unknown Compodium component path: ${traversalPath}`)
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(outOfRootPath)}`))
      .rejects.toThrow(`Unknown Compodium component path: ${outOfRootPath}`)
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(siblingPrefixPath)}`))
      .rejects.toThrow(`Unknown Compodium component path: ${siblingPrefixPath}`)
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(traversalPath)}`))
      .rejects.toThrow(`Unknown Compodium macro path: ${traversalPath}`)
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(outOfRootPath)}`))
      .rejects.toThrow(`Unknown Compodium macro path: ${outOfRootPath}`)
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&macro=${encodeURIComponent(siblingPrefixPath)}`))
      .rejects.toThrow(`Unknown Compodium macro path: ${siblingPrefixPath}`)
  })

  it('rejects metadata symlinks that escape configured roots', async () => {
    const outsidePath = resolve(viteServer.config.root, 'MetadataSymlinkTarget.vue')
    const symlinkPath = resolve(viteServer.config.root, 'src/components/MetadataSymlink.vue')

    try {
      await writeFile(outsidePath, '<script setup lang="ts">defineProps<{ escaped: string }>()</script>\n')
      await symlink(outsidePath, symlinkPath)

      await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(symlinkPath)}`))
        .rejects.toThrow(`Unknown Compodium component path: ${symlinkPath}`)
    } finally {
      await rm(symlinkPath, { force: true })
      await rm(outsidePath, { force: true })
    }
  })

  it('rejects malformed queries and unauthorized example paths', async () => {
    const traversalPath = resolve(viteServer.config.root, 'compodium/examples') + '/../examples/BasicComponentExampleWithFoo.vue'
    const unknownPath = resolve(viteServer.config.root, 'src/App.vue')
    const siblingPrefixPath = resolve(viteServer.config.root, 'compodium/examples-sibling/UnknownExample.vue')

    await expect(viteServer.pluginContainer.resolveId('virtual:compodium:example?t=1752500000000'))
      .rejects.toThrow('Compodium example module requires an example path')
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(examplePath)}&path=${encodeURIComponent(macroFreeExamplePath)}`))
      .rejects.toThrow('Duplicate Compodium example module query key')
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(examplePath)}&t=invalid`))
      .rejects.toThrow('Invalid Compodium example module timestamp: invalid')
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(traversalPath)}`))
      .rejects.toThrow(`Unknown Compodium example path: ${traversalPath}`)
    await expect(viteServer.pluginContainer.resolveId('virtual:compodium:example?path=%2Ftmp%2Fcompodium-out-of-root.vue'))
      .rejects.toThrow('Unknown Compodium example path: /tmp/compodium-out-of-root.vue')
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(unknownPath)}`))
      .rejects.toThrow(`Unknown Compodium example path: ${unknownPath}`)
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(siblingPrefixPath)}`))
      .rejects.toThrow(`Unknown Compodium example path: ${siblingPrefixPath}`)
  })

  it('rejects example symlinks that escape configured roots', async () => {
    const outsidePath = resolve(viteServer.config.root, 'ExampleSymlinkTarget.vue')
    const symlinkPath = resolve(viteServer.config.root, 'compodium/examples/ExampleSymlink.vue')

    try {
      await writeFile(outsidePath, '<template><div>escaped</div></template>\n')
      await symlink(outsidePath, symlinkPath)

      await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:example?path=${encodeURIComponent(symlinkPath)}`))
        .rejects.toThrow(`Unknown Compodium example path: ${symlinkPath}`)
    } finally {
      await rm(symlinkPath, { force: true })
      await rm(outsidePath, { force: true })
    }
  })

  it('rejects duplicate and invalid metadata and colors timestamps', async () => {
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&t=1752500000000&t=1752500000001`))
      .rejects.toThrow('Duplicate Compodium metadata module query key')
    await expect(viteServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(componentPath)}&t=invalid`))
      .rejects.toThrow('Invalid Compodium metadata module timestamp: invalid')
    await expect(viteServer.pluginContainer.resolveId('virtual:compodium:colors?t=1752500000000&t=1752500000001'))
      .rejects.toThrow('Unsupported Compodium colors module query')
    await expect(viteServer.pluginContainer.resolveId('virtual:compodium:colors?t=invalid'))
      .rejects.toThrow('Unsupported Compodium colors module query')
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

  it('accepts a configured component root created after server startup', async () => {
    const lateRoot = resolve(viteServer.config.root, 'late-metadata-components')
    const lateComponent = resolve(lateRoot, 'LateComponent.vue')
    const outsideComponent = resolve(viteServer.config.root, 'src/App.vue')
    await rm(lateRoot, { recursive: true, force: true })
    const lateRootServer = await createViteDevServer('./fixtures/basic', undefined, {
      componentDirs: [{ path: './late-metadata-components' }],
      includeLibraryCollections: false
    })

    try {
      await mkdir(lateRoot, { recursive: true })
      await writeFile(lateComponent, '<script setup lang="ts">defineProps<{ late: string }>()</script>\n')
      lateRootServer.watcher.emit('addDir', lateRoot)

      const metadata = await lateRootServer.ssrLoadModule(`virtual:compodium:meta?component=${encodeURIComponent(lateComponent)}`)
      expect(metadata.default.props).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'late' })
      ]))
      await expect(lateRootServer.pluginContainer.resolveId(`virtual:compodium:meta?component=${encodeURIComponent(outsideComponent)}`))
        .rejects.toThrow('Unknown Compodium component path')
    } finally {
      await lateRootServer.close()
      await rm(lateRoot, { recursive: true, force: true })
    }
  })

  it('accepts a configured example root created after server startup', async () => {
    const lateCompodiumDir = resolve(viteServer.config.root, 'late-compodium')
    const lateExampleRoot = resolve(lateCompodiumDir, 'examples')
    const lateExample = resolve(lateExampleRoot, 'LateComponentExample.vue')
    await rm(lateCompodiumDir, { recursive: true, force: true })
    const lateRootServer = await createViteDevServer('./fixtures/basic', undefined, {
      dir: './late-compodium',
      includeLibraryCollections: false
    })

    try {
      await mkdir(lateExampleRoot, { recursive: true })
      await writeFile(lateExample, '<script setup lang="ts">extendCompodiumMeta({ defaultProps: { late: true } })</script>\n<template><div>late</div></template>\n')

      const example = await lateRootServer.ssrLoadModule(`virtual:compodium:example?path=${encodeURIComponent(lateExample)}`)
      expect(example.default).toContain('<div>late</div>')
      expect(example.default).not.toContain('extendCompodiumMeta')
    } finally {
      await lateRootServer.close()
      await rm(lateCompodiumDir, { recursive: true, force: true })
    }
  })
})
