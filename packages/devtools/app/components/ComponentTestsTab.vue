<script setup lang="ts">
import type { Component } from '@compodium/core'

const props = defineProps<{
  component?: Component
}>()

const { suites, runTests, testStatus } = useVitest()

const componentTests = computed<TestState[]>(() => {
  if (!props.component) return []
  const suite = suites.get(props.component.pascalName)
  return Array.from(suite?.tests?.values() ?? []) as TestState[]
})
</script>

<template>
  <div class="bg-default border-t border-default sticky top-0 z-1 gap-0.5">
    <div
      v-if="!componentTests?.length && testStatus === 'run'"
      class="flex flex-col gap-2 justify-center items-center text-md text-muted p-8"
    >
      <p> Running... </p>
      <UIcon
        name="lucide:loader"
        class="animate-spin"
      />
    </div>
    <div
      v-else-if="!componentTests?.length"
      class="text-dimmed text-center p-8"
    >
      <UIcon
        name="lucide:flask-conical-off"
        size="20"
      />

      <p class="mt-1">
        No test results available
      </p>

      <UButton
        variant="subtle"
        icon="lucide:circle-play"
        trailing
        class="mt-3"
        loading-auto
        @click="runTests()"
      >
        Run tests
      </UButton>
    </div>
    <TestResult
      v-for="test in componentTests"
      :key="test.id"
      v-bind="test"
    />
  </div>
</template>
