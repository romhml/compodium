<script setup lang="ts">
import type { TestResult } from 'vitest/node'

const { testsRunning } = useCompodiumTests()
defineProps<{
  status?: TestResult['state']
}>()
</script>

<template>
  <UIcon
    v-if="status === 'passed'"
    class="size-3 bg-success"
    name="rivet-icons:check-circle-solid"
  />
  <UIcon
    v-else-if="status === 'failed'"
    class="size-3 bg-error"
    name="rivet-icons:minus-circle-solid"
  />
  <span v-else-if="status === 'pending' || (status === undefined && testsRunning)">
    <span class="relative flex size-2.5 items-center justify-center">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
      <span class="relative inline-flex size-2 rounded-full bg-warning" />
    </span>
  </span>
  <span v-else />
</template>
