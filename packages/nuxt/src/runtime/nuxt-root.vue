<script setup lang="ts">
// @ts-expect-error virtual file
import NuxtRoot from '#build/compodium/root.mjs'
import CompodiumRoot from '@compodium/core/runtime/root.vue'

import { useNuxtApp } from '#imports'

const nuxtApp = useNuxtApp()
const url = import.meta.server ? nuxtApp.ssrContext?.url : window.location.pathname

if (url?.startsWith('/__compodium__/renderer')) {
  // Silence Nuxt warnings on unused pages / layouts
  const app = useNuxtApp()
  app._isNuxtPageUsed = true
  app._isNuxtLayoutUsed = true
}
</script>

<template>
  <CompodiumRoot v-if="url?.startsWith('/__compodium__/renderer')" />
  <NuxtRoot v-else />
</template>
