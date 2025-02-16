import fs from 'node:fs/promises'
import { defineEventHandler } from 'h3'
import type { Component as NuxtComponent } from '@nuxt/schema'
import type { ComponentCollection, Collection, ComponentExample } from '../../..'
import { useAppConfig } from '#imports'

export default defineEventHandler(async () => {
  const appConfig = useAppConfig()
  const collections = appConfig.compodium.collections as Collection[]

  const componentsRaw = await fs.readFile(appConfig.compodium.componentsPath, 'utf-8')
  const components = Object.values(JSON.parse(componentsRaw)) as (NuxtComponent | ComponentExample)[]
  const examples = components.filter(c => c.isExample)

  return components.reduce((acc, component) => {
    const collection = collections.find((c) => {
      if (!c.external && component.filePath?.match('node_modules/')) return false
      return component.filePath?.match(c.match)
    })

    if (!collection || component.isExample) return acc

    const componentExamples = collection.external
      ? examples?.filter(e => e.pascalName.match(`${component.pascalName}Example`))
      : examples?.filter(e => e.pascalName.match(`${collection.name}${component.pascalName}`))

    acc[collection.name] ??= { ...collection, components: {} }
    acc[collection.name].components[component.pascalName] = { ...component, examples: componentExamples }

    return acc
  }, {} as Record<string, ComponentCollection>)
})
