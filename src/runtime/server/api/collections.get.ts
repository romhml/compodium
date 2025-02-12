import { defineEventHandler } from 'h3'
// @ts-expect-error - Not resolve from tsconfig
import components from '#nuxt-component-meta/nitro'
import type { ComponentData as NuxtComponentData } from 'nuxt-component-meta'
import type { ModuleOptions } from '../../../module'
import type { ComponentCollection } from '../../../types'

export default defineEventHandler(() => {
  const appConfig = useAppConfig()
  const collections = (appConfig._compodium as ModuleOptions).collections

  return Object.values(components as Record<string, NuxtComponentData>).reduce((acc, component) => {
    const collection = collections.find((c) => {
      if (!c.external && component.filePath?.match('node_modules/')) return false
      return component.filePath?.match(c.match)
    })
    if (collection) {
      acc[collection.name] ??= {}
      acc[collection.name][component.pascalName] = component
    }
    return acc
  }, {} as Record<string, ComponentCollection>)
})
