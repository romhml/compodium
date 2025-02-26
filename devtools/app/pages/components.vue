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
const activeComponent = ref()

async function onSelect(node: ComponentCollection | Component | ComponentExample) {
  if (!node || node?.components) return
  const example = node.isExample ? node.pascalName : undefined
  await navigateTo({ path: `/components/${kebabCase(node.componentId)}`, query: { example } })
  activeComponent.value = node.pascalName
  modalState.value = false
  nextTick().then(() => {
    scrollToSelected()
  })
}

const container = ref()
async function scrollToSelected() {
  container.value?.querySelector('[data-active=""]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
    label: col.name,
    icon: col.icon,
    defaultOpen: true,
    children: Object.values(col.components).map(comp => ({
      label: comp.name,
      active: activeComponent.value === comp.pascalName,
      defaultOpen: true,
      onSelect() {
        activeComponent.value = comp.pascalName
        navigateTo({ path: `/components/${kebabCase(comp.componentId)}`, query: { example: comp.isExample ? comp.pascalName : undefined } })
      },
      children: Object.values(comp.examples ?? {}).map((ex: any) => ({
        label: ex.name,
        active: activeComponent.value === ex.pascalName,
        onSelect() {
          activeComponent.value = ex.pascalName
          navigateTo({ path: `/components/${kebabCase(comp.componentId)}`, query: { example: ex.pascalName } })
        }
      }))
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
  <div
    ref="container"
    class="relative flex w-screen h-screen overflow-y-scroll bg-(--ui-bg-elevated)/50"
  >
    <UNavigationMenu
      :items="treeItems"
      orientation="vertical"
      class="mt-2 px-1 overflow-y-scroll border-r border-(--ui-border) hidden xl:block xl:w-xs"
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
