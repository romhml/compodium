<!-- src/runtime/root.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import RendererComponent from './renderer.vue'
// @ts-expect-error virtual file
import NuxtRoot from '#build/compodium/root.mjs'
import { useNuxtApp } from '#imports'

const nuxtApp = useNuxtApp()
const url = import.meta.server ? nuxtApp.ssrContext?.url : window.location.pathname

const PreviewComponent = url?.startsWith('/__compodium__/renderer') && defineAsyncComponent(async () => {
  // @ts-expect-error virtual file
  return await import('#build/compodium/preview.mjs').then(c => c.default)
})
</script>

<template>
  <Suspense v-if="url?.startsWith('/__compodium__/renderer')">
    <PreviewComponent>
      <RendererComponent />
    </PreviewComponent>
  </Suspense>
  <NuxtRoot v-else />
</template>
