<script setup lang="ts">
import type { Component, ComponentCollection, ComponentExample } from '@compodium/core'

const props = defineProps<{ collections: ComponentCollection[] }>()
const modelValue = defineModel<Component | ComponentExample>()

const { suites } = useVitest()

const treeItems = computed(() => {
  if (!props.collections) return

  return props.collections?.map(col => ({
    label: col.name,
    pascalName: col.name,
    icon: col.icon,
    defaultExpanded: true,
    children: col.components?.map(comp => ({
      label: comp?.isExample ? comp.pascalName.replace(/Example$/, '') : comp.pascalName,
      pascalName: comp.pascalName,
      active: modelValue.value?.pascalName === comp.pascalName,
      onSelect() {
        modelValue.value = comp
      },
      children: comp.examples?.map(ex => ({
        label: ex.pascalName.replace(comp.pascalName, ''),
        pascalName: ex.pascalName,
        active: modelValue.value?.pascalName === ex.pascalName,
        onSelect() {
          modelValue.value = ex
        }
      }))
    }))
  })).filter(col => col.children?.length > 0)
})
</script>

<template>
  <UTree
    :items="treeItems"
    class="px-1 py-2"
    :ui="{ linkLabel: 'mt-0.5' }"
  >
    <template #item-leading="{ item }">
      <UIcon
        v-if="item.icon"
        :name="item.icon"
        class="size-4.5"
      />
      <UIcon
        v-else-if="item.children?.length"
        name="lucide:chevron-right"
        class="transform transition-transform duration-200 group-data-expanded:rotate-90 size-4.5"
      />
      <span v-else />
    </template>
    <template #item-trailing="{ item }">
      <TestStatusIcon :status="suites.get(item.pascalName)?.state" />
    </template>
  </UTree>
</template>
