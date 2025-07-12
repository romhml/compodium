/// <reference lib="dom" />
/// <reference types="@vitest/browser/providers/playwright" />

import { afterAll, beforeAll, expect, test } from 'vitest'
import { page } from '@vitest/browser/context'
import type { ComponentCollection, PluginOptions } from '@compodium/core'
import { describeComponent } from '@compodium/testing/e2e'

declare module 'vitest' {
  interface ProvidedContext {
    'compodium.options': PluginOptions
    'compodium.dir': string
  }
}

const collections = await fetch('/__compodium__/api/collections').then(async r => (await r.json()) as ComponentCollection[])
const components = collections.flatMap(col => col.components?.flatMap(comp => [comp, ...(comp.examples ?? [])]))

components.forEach((component) => {
  describeComponent(component.pascalName, () => {
    beforeAll(() => {
      const style = window.document.createElement('style')
      style.id = 'compodium-disable-animations'
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          transform: none !important;
        }

        /* Disable CSS animations */
        * {
          -webkit-animation: none !important;
          -moz-animation: none !important;
          -o-animation: none !important;
          -ms-animation: none !important;
          animation: none !important;
        }
      `

      window.document.head.appendChild(style)
    })

    afterAll(() => {
      const existing = window.document.getElementById('compodium-disable-animations')
      if (existing) {
        existing.remove()
      }
    })

    test('visual regression', async (task) => {
      await expect(page.getByTestId('preview')).toMatchScreenshot(`${component.pascalName}.png`, task)
    })
  })
})
