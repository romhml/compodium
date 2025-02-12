<script setup lang="ts">
import type { Component } from '../../../src/types'

const props = defineProps<{ component: Component }>()

const previewUrl = computed(() => {
  if (!props.component) return
  const baseUrl = `/__compodium__/renderer`
  const params = new URLSearchParams({
    name: props.component.pascalName
  })
  return `${baseUrl}?${params.toString()}`
})

const rendererLoaded = ref(false)
watch(() => props.component, () => {
  rendererLoaded.value = false
})

function onComponentLoaded() {
  rendererLoaded.value = true
}

onMounted(() => {
  window.addEventListener('compodium:component-loaded', onComponentLoaded)
})

onUnmounted(() => {
  window.removeEventListener('compodium:component-loaded', onComponentLoaded)
})
</script>

<template>
  <div class="flex flex-col bg-grid">
    <iframe
      v-if="component"
      v-show="rendererLoaded"
      ref="renderer"
      class="grow w-full"
      :src="previewUrl"
    />
    <div
      v-show="!rendererLoaded"
      class="grow"
    />
  </div>
</template>
