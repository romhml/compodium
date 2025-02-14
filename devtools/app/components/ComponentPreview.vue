<script setup lang="ts">
import type { Component } from '../../../src/types'

const props = defineProps<{ component?: Component }>()

const rendererLoaded = ref(false)
watch(() => props.component, () => {
  rendererLoaded.value = false
})
</script>

<template>
  <div class="flex flex-col bg-grid">
    <iframe
      v-if="component"
      ref="renderer"
      class="grow w-full"
      src="/__compodium__/renderer"
      @load="rendererLoaded = true"
    />
  </div>
</template>
