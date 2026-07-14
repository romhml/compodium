import { dirname } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import type { ComponentCollection } from '@compodium/core'
import { joinURL } from 'ufo'
import { fileURLToPath } from 'node:url'
import { loadNativeModule } from './native-module'

describe('custom components dirs', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/custom-component-dirs'))
  await setup({
    rootDir,
    dev: true,
    setupTimeout: 30000
  })

  describe('collections module', () => {
    it('works', async () => {
      const collections = await loadNativeModule<ComponentCollection[]>('/__compodium__/modules/collections')
      expect(collections).toContainComponent({
        pascalName: 'BasicComponentExample'
      })

      expect(collections).toContainComponent({
        pascalName: 'UButton'
      })
    })
  })
})
