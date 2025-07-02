/// <reference lib="dom" />
/// <reference types="@vitest/browser/providers/playwright" />

import { afterAll, beforeAll, describe, inject, test } from 'vitest'
import { page, commands } from '@vitest/browser/context'
import type { CompodiumHooks, ComponentCollection, PluginOptions, CompodiumMeta } from '../../types'
import { joinURL } from 'ufo'
import type { Hookable } from 'hookable'

declare global {
  interface Window {
    __COMPODIUM_HOOKS__?: Hookable<CompodiumHooks>
  }
}

declare module 'vitest' {
  interface ProvidedContext {
    'compodium.options': PluginOptions
    'compodium.dir': string
  }
}

// const options = inject('compodium.options')
const dir = inject('compodium.dir')

const collections = await fetch('/__compodium__/api/collections').then(async r => (await r.json()) as ComponentCollection[])

const hooks = window.__COMPODIUM_HOOKS__ as Hookable<CompodiumHooks>

// Disable CSS Animation for consistent screenshots
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

  // Inject into document head
  window.document.head.appendChild(style)
})

afterAll(() => {
  // Remove existing style if present
  const existing = window.document.getElementById('compodium-disable-animations')
  if (existing) {
    existing.remove()
  }
})

describe.each(collections)(`$name`, async (collection) => {
  // Disable animations using DOM manipulation
  const style = window.document.createElement('style')
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
  const testComponents = collection.components.flatMap(c => [c, ...(c.examples ?? [])])

  test.each(testComponents)('$pascalName', async (component) => {
    const meta = await fetch(`/__compodium__/api/meta?component=${component.filePath}`).then(async r => (await r.json()) as CompodiumMeta)

    await hooks?.callHook('renderer:update-component', {
      path: component.filePath,
      props: meta.compodium?.defaultProps,
      wrapper: collection.wrapperComponent,
      events: meta.events
    })

    await commands.waitForNetworkIdle()
    const screenshotPath = joinURL(dir, `./__screenshots__/${component.pascalName}.png`)
    await page.screenshot({ path: screenshotPath, element: page.getByTestId('component') })
  })
})
