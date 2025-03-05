import fs from 'node:fs/promises'
import { defineEventHandler } from 'h3'
import type { Component, ComponentCollection, Collection, ComponentExample } from '../../../types'
import { useAppConfig } from '#imports'
import { getComponentCollection } from '../../utils'

export default defineEventHandler(async () => {
  const config = (useAppConfig().compodium) as any
  // @ts-expect-error virtual file
  const collections: Collection[] = await import('#compodium/nitro/collections').then(i => i.default)

  const componentsRaw = await fs.readFile(config.componentsPath, 'utf-8')
  const components = Object.values(JSON.parse(componentsRaw)) as (Component | ComponentExample)[]
  const examples = components.filter(c => c.isExample)

  return components.filter(e => !e.isExample).reduce((acc, component) => {
    const collection = getComponentCollection(component, collections)
    if (!collection || component.isExample) return acc

    const componentExamples = examples?.filter(e => e.pascalName.startsWith(`${component.pascalName}Example`))
    const mainExample = componentExamples.find(e => e.pascalName === `${component.pascalName}Example`)

    acc[collection.id] ??= { ...collection, components: {} }
    acc[collection.id].components[component.componentId] = {
      ...(mainExample ?? component),
      name: component.pascalName,
      baseName: component.baseName,
      componentId: component.componentId,
      collectionId: collection.id,
      examples: componentExamples.filter(e => e.pascalName !== mainExample?.pascalName).map(e => ({
        name: e.pascalName.replace(`${component.pascalName}Example`, ''),
        ...e,
        collectionId: collection.id,
        componentId: component.componentId
      }))
    }

    return acc
  }, {} as Record<string, ComponentCollection>)
})
