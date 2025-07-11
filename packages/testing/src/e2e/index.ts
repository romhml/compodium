import { beforeAll, describe, beforeEach } from 'vitest'
import type { CompodiumHooks, ComponentCollection, CompodiumMeta, Component } from '@compodium/core'
import type { Hookable } from 'hookable'

export { page } from '@vitest/browser/context'
declare module 'vitest' {
  interface TaskMeta {
    compodium?: {
      name?: string
      diff?: boolean
    }
  }
}

const collections = await fetch('/__compodium__/api/collections').then(async r => (await r.json()) as ComponentCollection[])

const componentMap = collections.flatMap(col => col.components?.flatMap(comp => [comp, ...(comp.examples ?? [])])).reduce((acc, c) => {
  acc[c.pascalName] = c
  return acc
}, {} as Record<string, Component>)

const hooks = window.__COMPODIUM_HOOKS__ as Hookable<CompodiumHooks>

export type CompodiumTestFunction = (ctx: {
  component: Component
  meta: CompodiumMeta
  collection: ComponentCollection
}) => void | Promise<void>

export function describeComponent(componentName: string, fn: CompodiumTestFunction) {
  const component = componentMap[componentName]
  const collection = collections.find(c => c.name === component.collectionName) as ComponentCollection

  if (!component) throw new Error(`[Compodium] Component not found ${componentName}`)

  return describe(collection.name, async () => {
    describe(componentName, async () => {
      beforeAll((suite) => {
        suite.meta.compodium ??= {}
        suite.meta.compodium.name = componentName
      })

      const meta = await fetch(`/__compodium__/api/meta?component=${component.filePath}`).then(async r => (await r.json()) as CompodiumMeta)

      beforeEach(async () => {
        await hooks?.callHook('renderer:update-component', {
          path: component.filePath,
          props: meta.compodium?.defaultProps,
          wrapper: collection.wrapperComponent,
          events: meta.events
        })
      })

      await fn({ collection, component, meta })
    })
  })
}
