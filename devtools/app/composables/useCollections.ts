import type { ComponentCollection } from '#module/types'

export function useCollections() {
  const collections = useState<Record<string, ComponentCollection>>('__compodium-collections', () => ({}))

  async function fetchCollections() {
    collections.value = await $fetch<Record<string, ComponentCollection>>('/api/collections', { baseURL: '/__compodium__' })
  }

  function getComponent(componentId: string) {
    for (const collection of Object.values(collections.value)) {
      const component = collection.components[componentId]
      if (component) return component
    }
  }

  function getExampleComponent(exampleId: string) {
    const regex = /^(.+)Example/
    const match = exampleId.match(regex)
    if (!match) return null

    const componentId = match[1] as string

    for (const collection of Object.values(collections.value)) {
      const component = collection.components[componentId]

      if (!component) continue

      if (!component.examples?.length) return component

      const example = component.examples.find((e: any) => e.pascalName === exampleId)

      if (example) return example
    }

    return null
  }

  return {
    fetchCollections,
    collections,
    getComponent,
    getExampleComponent
  }
}
