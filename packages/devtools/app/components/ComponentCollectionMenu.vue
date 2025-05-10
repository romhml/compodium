<script setup lang="ts">
import type { Component, ComponentCollection, ComponentExample } from '@compodium/core'

const props = defineProps<{ collections: ComponentCollection[] }>()
const modelValue = defineModel<Component | ComponentExample>()

const treeItems = computed(() => {
  if (!props.collections) return

  return props.collections?.map(col => ({
    label: col.name,
    icon: col.icon,
    defaultOpen: true,
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
  <UNavigationMenu
    :items="treeItems"
    orientation="vertical"
    class="px-1 bg-elevated/50"
  />
</template>
