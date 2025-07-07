<script setup lang="ts">
import type { Component, ComponentCollection, ComponentExample } from '@compodium/core'
import type { TestResult } from 'vitest/node'

const props = defineProps<{ collections: ComponentCollection[] }>()
const modelValue = defineModel<Component | ComponentExample>()

const { testResults, testStatus } = useCompodiumTests()

// Function to calculate aggregated test state
function calculateAggregatedState(
  ownState: TestResult['state'] | undefined,
  childrenStates: (TestResult['state'] | undefined)[]
): TestResult['state'] | undefined {
  if (childrenStates.includes('failed')) {
    return 'failed'
  }

  if (ownState === undefined) {
    if (childrenStates.length === 0) return undefined
    if (childrenStates.every(state => state === 'passed')) return 'passed'
    if (childrenStates.includes('pending') || (childrenStates.includes(undefined) && testStatus.value === 'running')) return 'pending'
    return undefined
  }

  if (ownState === 'failed') return 'failed'
  if (ownState === 'pending') return 'pending'

  if (ownState === 'passed') {
    if (childrenStates.length === 0) return 'passed'
    if (childrenStates.every(state => state === 'passed')) return 'passed'
    if (childrenStates.includes('pending')) return 'pending'
    if (childrenStates.includes('pending') || (childrenStates.includes(undefined) && testStatus.value === 'running')) return 'pending'
    return 'failed'
  }

  return ownState
}

const treeItems = computed(() => {
  if (!props.collections) return

  return props.collections?.map((col) => {
    const componentItems = col.components?.map((comp) => {
      const exampleItems = comp.examples?.map((ex) => {
        const exampleState = testResults.value?.[ex.pascalName]?.result.state
        return {
          label: ex.pascalName.replace(comp.pascalName, '').replace(/^Example/, ''),
          active: modelValue.value?.pascalName === ex.pascalName,
          pascalName: ex.pascalName,
          testState: exampleState,
          onSelect() {
            modelValue.value = ex
          }
        }
      }) || []

      // Calculate component aggregated state
      const componentOwnState = testResults.value?.[comp.pascalName]?.result.state
      const exampleStates = exampleItems.map(ex => ex.testState)
      const componentAggregatedState = calculateAggregatedState(componentOwnState, exampleStates)

      return {
        label: comp?.isExample ? comp.pascalName.replace(/Example$/, '') : comp.pascalName,
        pascalName: comp.pascalName.replace(/Example$/, ''),
        active: modelValue.value?.pascalName === comp.pascalName,
        testState: componentAggregatedState,
        onSelect() {
          modelValue.value = comp
        },
        children: exampleItems.length > 0 ? exampleItems : undefined
      }
    }) || []

    // Calculate collection aggregated state (collections typically don't have own tests)
    const componentStates = componentItems.map(comp => comp.testState)
    const collectionAggregatedState = calculateAggregatedState(undefined, componentStates)

    return {
      label: col.name,
      icon: col.icon,
      defaultExpanded: true,
      testState: collectionAggregatedState,
      children: componentItems.length > 0 ? componentItems : undefined
    }
  }).filter(col => col.children?.length)
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
      <TestStatusIcon :status="item.testState" />
    </template>
  </UTree>
</template>
