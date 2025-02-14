import { defineEventHandler } from 'h3'
import type { Component } from '@nuxt/schema'
import type { ModuleOptions } from '../../../module'
import type { ComponentCollection, ComponentExample } from '../../../types'
import { useAppConfig } from '#imports'
// @ts-expect-error virtual file
import components from '#compodium/nitro/components'

export default defineEventHandler(() => {
  const appConfig = useAppConfig()
  const collections = (appConfig._compodium as ModuleOptions).collections

  const examples = (appConfig._compodium as any).exampleComponents as Component[]

  return Object.values(components as Record<string, Component | ComponentExample>).reduce((acc, component) => {
    const collection = collections.find((c) => {
      if (!c.external && component.filePath?.match('node_modules/')) return false
      return component.filePath?.match(c.match)
    })

    if (!collection || component.isExample) return acc

    const componentExamples = examples?.filter(e => e.pascalName.match(`${collection.name}${component.pascalName}`))

    acc[collection.name] ??= { name: collection.name, icon: collection.icon, components: {} }
    acc[collection.name].components[component.pascalName] = { ...component, examples: componentExamples }

    return acc
  }, {} as Record<string, ComponentCollection>)
})
