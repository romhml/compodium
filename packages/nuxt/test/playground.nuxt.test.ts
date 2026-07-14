import { dirname } from 'pathe'
import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import type { ComponentCollection, CompodiumMeta } from '@compodium/core'
import { describe, expect, it } from 'vitest'
import { joinURL } from 'ufo'
import { loadNativeModule } from './native-module'
import { createTestNuxtConfig } from './test-config'

describe('nuxt playground', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), '../../../playgrounds/nuxt'))

  await setup({
    rootDir,
    dev: true,
    nuxtConfig: createTestNuxtConfig()
  })

  describe('Nuxt UI component metadata', () => {
    it('resolves UButton color prop literals from node_modules', async () => {
      const collections = await loadNativeModule<ComponentCollection[]>('/__compodium__/modules/collections')
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
      expect(buttonSourcePath).not.toContain('/playgrounds/nuxt/app/components/')

      const meta = await loadNativeModule<CompodiumMeta>('/__compodium__/modules/meta', {
        component: buttonSourcePath
      })

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
