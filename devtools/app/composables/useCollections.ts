import type { ComponentCollection } from '#module/types'

export function useCollections() {
  const collections = useState<Record<string, ComponentCollection>>('__compodium-collections', () => ({}))

  async function fetchCollections() {
    collections.value = await $fetch<Record<string, ComponentCollection>>('/api/collections', { baseURL: '/__compodium__' })
  }

  return {
    fetchCollections,
    collections
  }
}
