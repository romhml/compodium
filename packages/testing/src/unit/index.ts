import { describe, beforeEach } from 'vitest'
import type { CompodiumTestMeta } from '../types'
import type { ComponentCollection, CompodiumMeta, Component } from '@compodium/core'
import { getCurrentSuite } from 'vitest/suite'
import type { Component as VueComponent } from 'vue'
import { h } from 'vue'

declare module 'vitest' {
  interface TaskMeta {
    compodium?: CompodiumTestMeta
  }
}

// @ts-expect-error virtual import
const collections = await import(/* vite-ignore */ 'virtual:compodium/collections').then(c => c.default) as ComponentCollection[]

const componentMap = collections.flatMap(col => col.components?.flatMap(comp => [comp, ...(comp.examples ?? [])])).reduce((acc, c) => {
  acc[c.pascalName] = c
  return acc
}, {} as Record<string, Component>)

export type CompodiumTestFunction = (ctx: {
  component: VueComponent
  props?: Record<string, any>
  meta: CompodiumMeta
}) => void | Promise<void>

export function describeComponent(componentName: string, fn: CompodiumTestFunction) {
  const component = componentMap[componentName] ?? componentMap[componentName + `Example`]
  if (!component) throw new Error(`[Compodium] Component not found ${componentName}`)

  const collection = collections.find(c => c.name === component?.collectionName) as ComponentCollection

  return describe(collection.name, async () => {
    const { suite } = getCurrentSuite()
    suite!.meta.compodium = {
      collection: collection.name,
      suite: true
    }

    describe(component.pascalName, async () => {
      const { suite } = getCurrentSuite()
      suite!.meta.compodium = {
        collection: collection.name,
        component: component.pascalName,
        suite: true
      }

      beforeEach(({ task }) => {
        task.meta.compodium = {
          collection: collection.name,
          component: component.pascalName,
          name: task.name,
          suite: false
        }
      })

      const componentMeta = await import(/* vite-ignore */ `/@id/virtual:compodium/meta?component=${component.filePath}`).then(c => c.default) as CompodiumMeta

      const vueComponent = await import(/* vite-ignore */ component.filePath).then(c => c.default) as VueComponent
      const wrapperComponent = component.wrapperComponent ? await import(/* vite-ignore */ component.wrapperComponent).then(c => c.default) as VueComponent : null

      const testComponent = wrapperComponent
        ? {
            render(props: any) {
              return h(wrapperComponent, {}, {
                default: () => h(vueComponent, props)
              })
            }
          }
        : vueComponent

      await fn({ component: testComponent, props: componentMeta.compodium?.defaultProps, meta: componentMeta })
    })
  })
}

export function describeComponents(fn: CompodiumTestFunction) {
  collections.forEach((collection) => {
    collection.components.forEach(component => describeComponent(component.pascalName, fn))
  })
}
