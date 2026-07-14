import { afterAll, describe, expect, it } from 'vitest'
import { createServer, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { dirname, resolve } from 'pathe'
import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'
import type { ComponentCollection, CompodiumMeta } from '@compodium/core'
import { compodium } from '../src/index'

describe('vue playground', async () => {
  const root = fileURLToPath(joinURL(dirname(import.meta.url), '../../../playgrounds/vue'))
  const viteServer: ViteDevServer = await createServer({
    root,
    configFile: false,
    plugins: [
      vue(),
      ui({ ui: { colors: { neutral: 'zinc' } } }),
      compodium()
    ],
    resolve: {
      alias: {
        '@': resolve(root, './src')
      }
    },
    server: {
      middlewareMode: true,
      hmr: false,
      ws: false
    },
    optimizeDeps: {
      noDiscovery: true,
      include: []
    }
  })
  afterAll(async () => {
    await viteServer.close()
  })

  describe('Nuxt UI component metadata', () => {
    it('resolves UButton color prop literals from node_modules', async () => {
      const collections = (await viteServer.ssrLoadModule('virtual:compodium:collections')).default as ComponentCollection[]
      const nuxtUiCollection = collections.find(collection => collection.name === 'Nuxt UI')

      if (!nuxtUiCollection) {
        throw new Error('Expected Compodium collections to include Nuxt UI')
      }

      const button = nuxtUiCollection.components.find((component) => {
        const componentName = 'componentName' in component && typeof component.componentName === 'string'
          ? component.componentName
          : undefined

        return component.pascalName === 'UButton' || componentName === 'UButton'
      })

      if (!button) {
        const componentNames = nuxtUiCollection.components
          .map((component) => {
            const componentName = 'componentName' in component && typeof component.componentName === 'string'
              ? component.componentName
              : undefined

            return componentName ?? component.pascalName
          })
          .join(', ')

        throw new Error(`Expected Nuxt UI collection to include UButton. Found: ${componentNames}`)
      }

      const componentPath = 'componentPath' in button && typeof button.componentPath === 'string'
        ? button.componentPath
        : undefined

      const buttonSourcePath = [button.filePath, button.realPath, componentPath]
        .find(path => path?.includes('@nuxt/ui'))

      if (!buttonSourcePath) {
        throw new Error('Expected UButton to resolve to a Nuxt UI component path')
      }

      expect(buttonSourcePath).toContain('@nuxt/ui')
      expect(buttonSourcePath).not.toContain('/playgrounds/vue/src/components/')

      if (!('isExample' in button) || button.isExample !== true) {
        throw new Error('Expected UButton to use its selected library example')
      }
      const example = await viteServer.ssrLoadModule(`virtual:compodium:example?path=${encodeURIComponent(button.filePath)}`)
      expect(example.default).toBeTypeOf('string')
      expect(example.default).not.toContain('extendCompodiumMeta')

      const meta = (await viteServer.ssrLoadModule(`virtual:compodium:meta?component=${encodeURIComponent(buttonSourcePath)}`)).default as CompodiumMeta
      const colorProp = meta.props.find(prop => prop.name === 'color')

      if (!colorProp) {
        throw new Error('Expected component metadata to include color prop')
      }

      const colorSchema = colorProp.schema.find(schema => schema.inputType === 'stringEnum')?.schema

      if (!colorSchema || typeof colorSchema !== 'object' || !('schema' in colorSchema) || !Array.isArray(colorSchema.schema)) {
        throw new Error('Expected color prop metadata to include parsed enum options')
      }

      expect(colorProp.required).toBe(false)
      expect(colorSchema.schema).toEqual(expect.arrayContaining([
        'primary',
        'secondary',
        'success',
        'info',
        'warning',
        'error',
        'neutral'
      ]))
    })
  })
})
