<script setup lang="ts">
import type { Component, ComponentCollection, ComponentExample, CompodiumTestResult } from '@compodium/core'

const props = defineProps<{ collections: ComponentCollection[], testStatus?: Record<string, CompodiumTestResult>, testRunning?: boolean }>()
const modelValue = defineModel<Component | ComponentExample>()

const treeItems = computed(() => {
  if (!props.collections) return

  return props.collections?.map(col => ({
    label: col.name,
    icon: col.icon,
    defaultOpen: true,
    children: col.components?.map(comp => ({
      status: props.testStatus?.[comp.pascalName]?.result.state,
      label: comp?.isExample ? comp.pascalName.replace(/Example$/, '') : comp.pascalName,
      active: modelValue.value?.pascalName === comp.pascalName,
      onSelect() {
        modelValue.value = comp
      },
      children: comp.examples?.map(ex => ({
        status: props.testStatus?.[ex.pascalName]?.result.state,
        label: ex.pascalName,
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
  >
    <template #item-trailing="{ item }">
      <UChip
        v-if="item?.status === 'passed'"
        color="success"
      />
      <UChip
        v-else-if="item.status === 'fail'"
        color="error"
      />
      <UChip
        v-else-if="item.status === 'skipped'"
        color="warning"
      />
      <UChip
        v-else-if="testRunning"
        color="info"
      />
    </template>
  </UNavigationMenu>
</template>
