/// <reference path="@compodium/testing/types.d.ts" />

import { beforeAll, describe, beforeEach } from 'vitest'
import type { ComponentCollection, CompodiumMeta, Component } from '@compodium/core'
import type { Component as VueComponent } from 'vue'

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
    // TODO: Pass meta in way that will be resolved when the test modules are collected instead.
    // This will allow to display loaders on the initial test run.
    // The docs mention something to achieve this but seems outdated: https://vitest.dev/advanced/api/test-suite.html#meta
    beforeAll((task) => {
      task.meta.compodium = {
        collection: collection.name,
        suite: true
      }
    })

    describe(component.pascalName,
      async () => {
        beforeAll((task) => {
          task.meta.compodium = {
            collection: collection.name,
            component: component.pascalName,
            suite: true
          }
        })

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
        await fn({ component: vueComponent, props: componentMeta.compodium?.defaultProps, meta: componentMeta })
      })
  })
}
