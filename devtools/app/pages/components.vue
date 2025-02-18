<script setup lang="ts">
const { collections, fetchCollections } = useCollections()
import type { ComponentCollection, ComponentExample } from '#module/types'

useAsyncData('__compodium-fetch-collection', async () => {
  await fetchCollections()
  return true
})

const currentComponent = ref()

function getTreeChildren(node: ComponentCollection | Component | ComponentExample) {
  const components = Object.values(node.components ?? {})
  const examples = Object.values(node.examples ?? {})
  if (components?.length) return components
  if (examples?.length) return examples
}

async function onSelect(node: ComponentCollection | Component | ComponentExample) {
  if (node.components) return
  const example = node.metaId !== node.pascalName ? node.pascalName : undefined
  await navigateTo({ path: `/components/${node.metaId}`, query: { example } })
}
</script>

<template>
  <div class="absolute top-0 bottom-0 inset-x-0 grid xl:grid-cols-8 grid-cols-4 bg-(--ui-bg-muted)">
    <UTree
      v-model="currentComponent"
      :items="Object.values(collections ?? {})"
      size="lg"
      class="mt-2 px-1 overflow-y-scroll border-r border-(--ui-border)"
      label-key="pascalName"
      parent-trailing-icon="lucide:chevron-down"
      :ui="{ itemTrailingIcon: 'group-data-expanded:rotate-180 transition-transform duration-200 ml-auto' }"
      :get-children="getTreeChildren"
      @update:model-value="onSelect"
    >
      <template #item-leading="{ hasChildren, expanded, item }">
        <UIcon
          v-if="item.icon"
          :name="item.icon"
          size="lg"
        />
        <UIcon
          v-else-if="hasChildren && expanded && item.components"
          name="lucide:folder-open"
          size="lg"
        />
        <UIcon
          v-else-if="hasChildren && item.components"
          name="lucide:folder"
          size="lg"
        />
      </template>
    </UTree>
    <NuxtPage page-key="static" />
  </div>
</template>
