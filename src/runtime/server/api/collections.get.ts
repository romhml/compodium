import fs from 'node:fs/promises'
import { defineEventHandler } from 'h3'
import type { Component as NuxtComponent } from '@nuxt/schema'
import type { ComponentCollection, Collection, ComponentExample } from '../../../types'
import { useAppConfig } from '#imports'
import { pascalCase } from 'scule'
import { getComponentCollection } from '../../utils'

export default defineEventHandler(async () => {
  const config = useAppConfig().compodium as any
  const collections = config.collections as Collection[]

  const componentsRaw = await fs.readFile(config.componentsPath, 'utf-8')
  const components = Object.values(JSON.parse(componentsRaw)) as (NuxtComponent | ComponentExample)[]
  const examples = components.filter(c => c.isExample)

  return components.reduce((acc, component) => {
    const collection = getComponentCollection(component, collections)
    if (!collection || component.isExample) return acc

    const collectionPrefix = collection.external ? '' : pascalCase(collection.name)

    const componentExamples = examples?.filter(e => e.pascalName.match(`${collectionPrefix}${component.pascalName}Example`))

    const mainExample = componentExamples.find(e => e.pascalName === `${collectionPrefix}${component.pascalName}Example`)

    acc[collection.name] ??= { ...collection, pascalName: pascalCase(collection.name), components: {} }
    acc[collection.name].components[component.pascalName] = {
      ...component,
      ...mainExample,
      metaId: component.pascalName,
      examples: componentExamples.filter(e => e.pascalName !== mainExample?.pascalName).map(e => ({ metaId: component.pascalName, ...e }))
    }

    return acc
  }, {} as Record<string, ComponentCollection>)
})
