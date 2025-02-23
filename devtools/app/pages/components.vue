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
      await navigateTo({ path: `/components/${kebabCase(fallbackComponent.componentId)}`, query: { example } })
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
  tree.value?.$el?.querySelector?.('[data-active="true"]').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const collectionItems = computed(() =>
  Object.values(collections.value ?? {}).map(col => ({
    ...col,
    items: Object.values(col.components).map(comp => ({
      ...comp,
      id: comp.pascalName
    }))
  }))
)

const treeItems = computed(() =>
  Object.values(collections.value ?? {}).map(col => ({
    ...col,
    defaultExpanded: true,
    children: Object.values(col.components).map(comp => ({
      ...comp,
      id: comp.pascalName,
      defaultExpanded: true,
      children: Object.values(comp.examples ?? {}).map((ex: any) => ({ ...ex, id: ex.pascalName }))
    }))
  }))
)

// TODO: fix broken import
// defineShortcuts({
//   meta_shift_k: () => {
//     modalState.value = !modalState.value
//   }
// })
</script>

<template>
  <div class="relative flex w-screen h-screen overflow-y-scroll bg-(--ui-bg-elevated)/50">
    <UTree
      ref="tree"
      v-model="currentComponent"
      :items="treeItems"
      size="lg"
      class="mt-2 px-1 overflow-y-scroll border-r border-(--ui-border) hidden xl:block xl:w-xs"
      label-key="name"
      @update:model-value="onSelect"
    />

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
