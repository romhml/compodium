<script setup lang="ts">
import type { RunnerTaskResult } from 'vitest/node'

defineProps<{
  status?: RunnerTaskResult['state']
}>()
</script>

<template>
  <UIcon
    v-if="status === 'pass'"
    class="size-4 text-success"
    name="lucide:check"
  />
  <UIcon
    v-else-if="status === 'fail'"
    class="size-4 text-error"
    name="lucide:x"
  />
  <UIcon
    v-else-if="status === 'skip'"
    class="size-4 text-default/50"
    name="lucide:chevrons-right"
  />
  <UIcon
    v-else-if="status === 'queued' || status === 'run'"
    class="size-4 text-default/50 animate-spin"
    name="lucide:loader"
  />
  <span v-else />
</template>
