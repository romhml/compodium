/// <reference types="@compodium/core" />

import { describe, beforeEach } from 'vitest'
import type { ComponentCollection, CompodiumMeta, Component } from '@compodium/core'
import type { Component as VueComponent } from 'vue'

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
    describe(component.pascalName, async () => {
      const meta = await import(/* vite-ignore */ `/@id/virtual:compodium/meta?component=${component.filePath}`).then(c => c.default) as CompodiumMeta

      beforeEach(({ task }) => {
        task.meta.compodium = {
          component: component?.pascalName
        }
      })

      const comp = await import(/* vite-ignore */ component.filePath).then(c => c.default) as VueComponent
      await fn({ component: comp, props: meta.compodium?.defaultProps, meta })
    })
  })
}
