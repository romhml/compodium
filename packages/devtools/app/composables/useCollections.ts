import type { ComponentCollection } from 'compodium'

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

  return {
    fetchCollections,
    collections,
    getComponent
  }
}
