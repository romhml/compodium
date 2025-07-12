<script setup lang="ts">
import type { Component, ComponentCollection, ComponentExample } from '@compodium/core'

const props = defineProps<{ collections: ComponentCollection[] }>()
const modelValue = defineModel<Component | ComponentExample>()

const { testStates, testStatus, partialTestRun } = useComponentTests()

// const timeFormatter = new Intl.DurationFormat('en', { style: 'short' })

const treeItems = computed(() => {
  if (!props.collections) return

  return props.collections?.map(col => ({
    label: col.name,
    icon: col.icon,
    defaultExpanded: true,
    testState: testStates.value?.[col.name],
    children: col.components?.map(comp => ({
      label: comp?.isExample ? comp.pascalName.replace(/Example$/, '') : comp.pascalName,
      pascalName: comp.pascalName,
      active: modelValue.value?.pascalName === comp.pascalName,
      testState: testStates.value?.[comp.pascalName],
      onSelect() {
        modelValue.value = comp
      },
      children: comp.examples?.map(ex => ({
        label: ex.pascalName.replace(comp.pascalName, ''),
        pascalName: ex.pascalName,
        active: modelValue.value?.pascalName === ex.pascalName,
        testState: testStates.value?.[ex.pascalName],
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
    <template #item-trailing="{ item }">
      <!-- span
        v-if="testResults[item.pascalName]?.diagnostic?.duration"
        class="text-xs whitespace-nowrap"
        :class="{
          'text-warning': testResults[item.pascalName]?.diagnostic?.slow,
          'text-muted': !testResults[item.pascalName]?.diagnostic?.slow
        }"
      >
        {{ timeFormatter.format({ milliseconds: Math.round(testResults[item.pascalName]?.diagnostic?.duration) }) }}
      </span -->
      <TestStatusIcon
        v-if="!item.testState && testStatus === 'running' && !partialTestRun"
        status="pending"
      />
      <TestStatusIcon
        v-else
        :status="item.testState"
      />
    </template>
  </UTree>
</template>
