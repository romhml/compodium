<script setup lang="ts">
import type { Component } from '@compodium/core'

const props = defineProps<{
  component?: Component
}>()

async function runTests() {
  if (!props.component) return
  await $fetch(`/api/test?component=${props.component.pascalName}`)
  await refresh()
}

const { data: screenshot, refresh } = await useAsyncData(
  computed(() => props.component ? `screenshot-${props.component?.pascalName}` : 'screenshot-empty'),
  async () => {
    if (!props.component) return
    const blob = await $fetch<Blob>(`/api/screenshot?component=${props.component.pascalName}`)

    return URL.createObjectURL(blob)
  }
)
</script>

<template>
  <div class="bg-default p-0.5 border-t border-default sticky top-0 z-1 gap-0.5">
    <div class="p-2 flex justify-between items-center">
      <p class="font-semibold text-sm text-muted">
        No changes
      </p>
      <div>
        <UButton
          variant="subtle"
          icon="lucide:circle-play"
          trailing
          loading-auto
          @click="runTests"
        >
          Run tests
        </UButton>
      </div>
    </div>
    <div class="p-2">
      <img
        v-if="screenshot"
        :src="screenshot"
        class="object-scale-down w-full bg-elevated/50 border border-default rounded"
      >
    </div>
  </div>
</template>
