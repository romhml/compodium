/// <reference lib="dom" />
/// <reference types="@vitest/browser/providers/playwright" />

import { expect, test } from 'vitest'
import { page } from '@vitest/browser/context'
import type { ComponentCollection, PluginOptions } from '@compodium/core'
import { describeComponent } from '@compodium/testing/e2e'

declare module 'vitest' {
  interface ProvidedContext {
    'compodium.options': PluginOptions
    'compodium.dir': string
  }
}

const collections = await import('virtual:compodium/collections').then(c => c.default) as ComponentCollection[]
const components = collections.flatMap(col => col.components?.flatMap(comp => [comp, ...(comp.examples ?? [])]))

components.forEach((component) => {
  describeComponent(component.pascalName, () => {
    test('visual regression', async () => {
      await expect(page.getByTestId('__compodium-preview')).toMatchScreenshot(`${component.pascalName}`, {
        screenshotOptions: {
          animations: 'disabled'
        }
      })
    })
  })
})
