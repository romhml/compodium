import { defineEventHandler } from 'h3'
// @ts-expect-error - Not resolve from tsconfig
import components from '#nuxt-component-meta/nitro'
import type { ComponentData as NuxtComponentData } from 'nuxt-component-meta'
import type { ModuleOptions } from '../../../module'
import type { ComponentCollection } from '../../../types'
import { useAppConfig } from '#imports'

export default defineEventHandler(() => {
  const appConfig = useAppConfig()

  const collections = (appConfig._compodium as ModuleOptions).collections
  const examples = (appConfig._compodium as any).exampleComponents as NuxtComponentData[]

  return Object.values(components as Record<string, NuxtComponentData>).reduce((acc, component) => {
    const collection = collections.find((c) => {
      if (!c.external && component.filePath?.match('node_modules/')) return false
      return component.filePath?.match(c.match)
    })
    if (!collection) return acc

    const componentExamples = examples?.filter(e => e.pascalName.match(`${collection.name}${component.pascalName}`)).map(e => ({
      ...e,
      isExample: true as const,
      componentName: component.pascalName
    }))

    acc[collection.name] ??= { name: collection.name, icon: collection.icon, components: {} }
    acc[collection.name].components[component.pascalName] = { ...component, examples: componentExamples }

    return acc
  }, {} as Record<string, ComponentCollection>)
})
