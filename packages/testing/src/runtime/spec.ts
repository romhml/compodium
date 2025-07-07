/// <reference lib="dom" />
/// <reference types="@vitest/browser/providers/playwright" />

import { afterAll, beforeAll, describe, inject, expect, test } from 'vitest'
import { page, commands } from '@vitest/browser/context'
import type { CompodiumHooks, ComponentCollection, PluginOptions, CompodiumMeta, ComponentExample, Component } from '@compodium/core'
import { joinURL } from 'ufo'
import type { Hookable } from 'hookable'
import resemble from 'resemblejs'

declare module 'vitest' {
  interface ProvidedContext {
    'compodium.options': PluginOptions
    'compodium.dir': string
  }

  interface TaskMeta {
    compodium?: {
      component?: string
      diff?: boolean
    }
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

describe.each(collections.map(c => [c.name, c]))(`%s`, async (_, collection) => {
  // Disable animations using DOM manipulation
  const style = window.document.createElement('style')
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
  const testComponents = collection.components.flatMap(c => [c, ...(c.examples ?? [])])

  test.for(testComponents.map(c => [c.pascalName, c] as [string, Component & Partial<ComponentExample>]))('%s', async ([_, component], { task }) => {
    task.meta.compodium = {}
    task.meta.compodium.component = component.pascalName

    const meta = await fetch(`/__compodium__/api/meta?component=${component.filePath}`).then(async r => (await r.json()) as CompodiumMeta)

    await hooks?.callHook('renderer:update-component', {
      path: component.filePath,
      props: meta.compodium?.defaultProps,
      wrapper: collection.wrapperComponent,
      events: meta.events
    })

    await commands.waitForNetworkIdle()

    const screenshotPath = joinURL(dir, `./__screenshots__/${component.pascalName}.png`)
    const { base64: current } = await page.screenshot({ path: screenshotPath, element: page.getByTestId('preview'), save: true, base64: true })

    const stagedPath = joinURL(dir, `./__screenshots__/staged/${component.pascalName}.png`)
    const staged = await commands.readFile(stagedPath, { encoding: 'base64' }).catch(_ => null)

    if (staged) {
      await commands.writeFile(screenshotPath, current, { encoding: 'base64' })

      const diff: resemble.ComparisonResult = await new Promise(resolve => resemble(`data:image/png;base64,${staged}`).compareTo(`data:image/png;base64,${current}`).onComplete(data => resolve(data)))
      if (diff.error) {
        throw new Error(`[Compodium] Error while comparing screenshots:\n ${diff.error.toString()}`)
      }
      if (diff.rawMisMatchPercentage > 0.001) {
        task.meta.compodium.diff = true
        expect.fail(`Screenshot comparison failed.
Difference: ${diff.rawMisMatchPercentage.toFixed(3)}`)
      }
    } else {
      await commands.writeFile(stagedPath, current, { encoding: 'base64' })
    }
  })
})
