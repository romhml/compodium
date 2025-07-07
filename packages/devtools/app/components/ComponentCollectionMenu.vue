<script setup lang="ts">
import type { Component, ComponentCollection, ComponentExample } from '@compodium/core'

const props = defineProps<{ collections: ComponentCollection[] }>()
const modelValue = defineModel<Component | ComponentExample>()

const treeItems = computed(() => {
  if (!props.collections) return

  return props.collections?.map(col => ({
    label: col.name,
    icon: col.icon,
    defaultExpanded: true,
    children: col.components?.map(comp => ({
      label: comp?.isExample ? comp.pascalName.replace(/Example$/, '') : comp.pascalName,
      active: modelValue.value?.pascalName === comp.pascalName,
      onSelect() {
        modelValue.value = comp
      },
      children: comp.examples?.map(ex => ({
        label: ex.pascalName.replace(comp.pascalName, ''),
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
    class="px-1"
  >
    <template
      #item-leading="{ item }"
    >
      <UIcon
        v-if="item.icon"
        :name="item.icon"
      />
      <UIcon
        v-else-if="item.children?.length"
        name="lucide:chevron-right"
        class="transform transition-transform duration-200 group-data-expanded:rotate-90"
      />
      <span v-else />
    </template>
    <template #item-trailing>
      <span />
    </template>
  </UTree>
</template>
