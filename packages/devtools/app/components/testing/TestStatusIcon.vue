<script setup lang="ts">
import type { TestResult } from 'vitest/node'

defineProps<{
  status?: TestResult['state']
}>()
</script>

<template>
  <UIcon
    v-if="status === 'passed'"
    class="size-4 text-success"
    name="lucide:check"
  />
  <UIcon
    v-else-if="status === 'failed'"
    class="size-4 text-error"
    name="lucide:x"
  />
  <UIcon
    v-else-if="status === 'skipped'"
    class="size-4 text-default/50"
    name="lucide:chevrons-right"
  />
  <UIcon
    v-else-if="status === 'pending'"
    class="size-4 text-default/50 animate-spin"
    name="lucide:loader"
  />
  <span v-else />
</template>
