<script setup lang="ts">
import type { ComponentCollection, ComponentExample } from '#module/types'
import { kebabCase } from 'scule'

const route = useRoute()

const { collections, fetchCollections } = useCollections()
await useAsyncData('__compodium-fetch-collection', async () => {
  await fetchCollections()
  if (route.name === 'components') {
    const fallbackCollection = Object.values(collections.value)[0]
    const fallbackComponent = Object.values(fallbackCollection?.components ?? {})[0]

    if (fallbackComponent) {
      const example = fallbackComponent.isExample ? fallbackComponent.pascalName : undefined
      await navigateTo({ path: `/components/${fallbackComponent.componentId}`, query: { example } })
    } else {
      await navigateTo(`/welcome`)
    }
  }
  return true
})

const currentComponent = ref()
const modalState = ref(false)

async function onSelect(node: ComponentCollection | Component | ComponentExample) {
  if (!node || node.components) return
  const example = node.isExample ? node.pascalName : undefined
  await navigateTo({ path: `/components/${kebabCase(node.componentId)}`, query: { example } })
  modalState.value = false
  scrollToSelected()
}

const tree = ref()
async function scrollToSelected() {
  tree.value?.$el?.querySelector('[data-selected=""]').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const collectionItems = computed(() =>
  Object.values(collections.value ?? {}).map(col => ({
    ...col,
    defaultExpanded: true,
    items: Object.values(col.components).map(comp => ({
      ...comp,
      defaultExpanded: true,
      id: comp.pascalName,
      items: Object.values(comp.examples ?? {}).map((ex: any) => ({ ...ex, id: ex.pascalName }))
    }))
  }))
)

defineShortcuts({
  meta_shift_k: () => {
    modalState.value = !modalState.value
  }
})
</script>

<template>
  <div class="relative flex w-screen h-screen overflow-y-scroll bg-(--ui-bg-elevated)/50">
    <UTree
      ref="tree"
      v-model="currentComponent"
      :items="collectionItems"
      size="lg"
      class="mt-2 px-1 overflow-y-scroll border-r border-(--ui-border) hidden xl:block xl:w-xs"
      label-key="name"
      parent-trailing-icon="lucide:chevron-down"
      :ui="{ itemTrailingIcon: 'group-data-expanded:rotate-180 transition-transform duration-200 ml-auto' }"
      :get-children="(node) => node?.items?.length ? node?.items : undefined"
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

    <div class="flex relative w-full grow">
      <NuxtPage page-key="static" />
      <UModal v-model:open="modalState">
        <div class="absolute flex items-center top-2 left-2">
          <UTooltip
            text="Search"
            :kbds="['shift', 'meta', 'k']"
            :content="{ side: 'right' }"
          >
            <UButton
              icon="lucide:search"
              color="neutral"
              variant="link"
            />
          </UTooltip>
        </div>
        <template #content>
          <UCommandPalette
            v-model="currentComponent"
            :groups="collectionItems"
            placeholder="Search component..."
            label-key="name"
            class="h-80"
            @update:model-value="onSelect"
          />
        </template>
      </UModal>
    </div>
  </div>
</template>
