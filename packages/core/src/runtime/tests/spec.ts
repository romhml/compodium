import { describe, inject, test } from 'vitest'
import { page } from '@vitest/browser/context'
import type { CompodiumHooks, ComponentCollection, PluginOptions, CompodiumMeta } from '../../types'
import { joinURL } from 'ufo'
import type { Hookable } from 'hookable'

declare global {
  interface Window {
    __COMPODIUM_HOOKS__?: Hookable<CompodiumHooks>
  }

  const window: Window
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

describe.each(collections)(`$name`, async (collection) => {
  const testComponents = collection.components.flatMap(c => [c, ...(c.examples ?? [])])

  test.each(testComponents)('$pascalName', async (component) => {
    const meta = await fetch(`/__compodium__/api/meta?component=${component.filePath}`).then(async r => (await r.json()) as CompodiumMeta)

    await hooks?.callHook('renderer:update-component', {
      path: component.filePath,
      props: meta.compodium?.defaultProps,
      wrapper: collection.wrapperComponent,
      events: meta.events
    })

    const screenshotPath = joinURL(dir, `./__screenshots__/${component.pascalName}.png`)
    await page.screenshot({ base64: true, path: screenshotPath })
  })
})
