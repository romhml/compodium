<!-- src/runtime/root.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CompodiumRenderer from './pages/CompodiumRenderer.vue'
import { useNuxtApp } from '#imports'

// @ts-expect-error virtual file
const NuxtRoot = defineAsyncComponent(() => import('#build/compodium/root.mjs').then(c => c.default))

const nuxtApp = useNuxtApp()
const url = import.meta.server ? nuxtApp.ssrContext?.url : window.location.pathname
</script>

<template>
  <Suspense>
    <CompodiumRenderer v-if="url?.startsWith('/__compodium__/renderer')" />
    <NuxtRoot v-else />
  </Suspense>
</template>
