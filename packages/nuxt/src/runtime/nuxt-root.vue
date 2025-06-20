<script setup lang="ts">
// @ts-expect-error virtual file
import NuxtRoot from '#build/compodium/root.mjs'
import CompodiumRoot from '@compodium/core/runtime/root.vue'

import { useNuxtApp } from '#imports'
import { joinURL } from 'ufo'

const nuxtApp = useNuxtApp()
const url = import.meta.server ? nuxtApp.ssrContext?.url : window.location.pathname
const app = useNuxtApp()

const rendererUrl = joinURL(app.$config.app.baseURL, '/__compodium__/renderer')

if (url?.startsWith(rendererUrl)) {
  // Silence Nuxt warnings on unused pages / layouts
  app._isNuxtPageUsed = true
  app._isNuxtLayoutUsed = true
}
</script>

<template>
  <CompodiumRoot v-if="url?.startsWith(rendererUrl)" />
  <NuxtRoot v-else />
</template>
