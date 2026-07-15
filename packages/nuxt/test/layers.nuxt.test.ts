import { dirname, join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection } from '@compodium/core'
import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'

describe('Nuxt layers', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/layers'))
  const layerRootDir = join(rootDir, 'layer')

  await setup({
    rootDir,
    dev: true,
    setupTimeout: 30000
  })

  it('discovers root and inherited components and examples', async () => {
    const collections = await $fetch<ComponentCollection[]>('/__compodium__/api/collections')

    expect(collections).toContainComponent({ pascalName: 'RootComponentExample' })
    expect(collections).toContainComponent({ pascalName: 'LayerComponentExample' })
  })

  it('returns example directories in root-first layer order', async () => {
    const collections = await $fetch<ComponentCollection[]>('/__compodium__/api/collections')
    const applicationCollection = collections.find(collection => collection.name === 'Components')

    expect(applicationCollection?.exampleDirs).toEqual([
      { path: join(rootDir, 'compodium/examples'), pattern: '**/*.{vue,tsx}' },
      { path: join(layerRootDir, 'compodium/examples'), pattern: '**/*.{vue,tsx}' }
    ])
  })

  it('gives root examples precedence over inherited duplicates', async () => {
    const collections = await $fetch<ComponentCollection[]>('/__compodium__/api/collections')
    const applicationCollection = collections.find(collection => collection.name === 'Components')
    const duplicate = applicationCollection?.components.find(component => component.pascalName === 'DuplicateComponentExample')

    expect(duplicate?.filePath).toBe(join(rootDir, 'compodium/examples/DuplicateComponentExample.vue'))
  })

  it('serves inherited examples', async () => {
    const example = await $fetch<string>('/__compodium__/api/example', {
      query: {
        path: join(layerRootDir, 'compodium/examples/LayerComponentExample.vue')
      }
    })

    expect(example).toContain('<LayerComponent />')
  })

  it.each([
    ['traversal', join(rootDir, 'compodium/examples/../../package.json')],
    ['sibling-prefix', join(rootDir, 'compodium/examples-private/Example.vue')]
  ])('rejects %s paths outside example directories', async (_, path) => {
    await expect($fetch('/__compodium__/api/example', { query: { path } })).rejects.toMatchObject({
      statusCode: 403,
      data: { error: 'Forbidden' }
    })
  })

  it('uses an inherited preview when the root has none', async () => {
    const html = await $fetch('/__compodium__/renderer')

    expect(html).toContain('<div id="layer-preview"')
  })
})
