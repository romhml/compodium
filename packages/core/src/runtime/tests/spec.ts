import { test } from 'vitest'
import { page } from '@vitest/browser/context'
import { forEachComponents } from '@compodium/core/testing'
import type { ComponentCollection, PluginConfig } from '../../types'

declare module 'vitest' {
  interface ProvidedContext {
    'compodium.collections': ComponentCollection[]
    'compodium.config': PluginConfig
    'compodium.root': string
  }
}

await forEachComponents(({ pascalName, component, meta }) => {
  test(pascalName, async () => {
    const screen = (page as any).render(component, { props: meta?.compodium?.defaultProps })
    // expect(screen.container).toMatchSnapshot()
    await page.screenshot({ base64: true })
    screen.unmount()
  })
})
