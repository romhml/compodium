<script setup lang="ts">
import type { CompodiumHooks } from '@compodium/core'
import { createHooks } from 'hookable'

const hooks = createHooks<CompodiumHooks>()
hooks.hook('component:added', () => navigateTo('/components'))

onMounted(() => window.__COMPODIUM_HOOKS__ = hooks)
</script>

<template>
  <div
    class="h-screen w-screen flex flex-col justify-center items-center data-[spin=true]:animate-spin data-[bounce=true]:animate-bounce"
  >
    <iframe
      src="/__compodium__/renderer"
      class="hidden"
    />

    <div class="border border-(--ui-border) p-6 rounded-lg w-sm text-center flex flex-col">
      <p class="text-center font-bold text-xl mb-4">
        Welcome to Compodium!
      </p>
      <p> Create a component to get started. </p>
      <USeparator class="my-2">
        or
      </USeparator>
      <p class="bg-(--ui-bg-muted) rounded-md font-mono p-0.5">
        nuxi module add @nuxt/ui@next
      </p>
    </div>
  </div>
</template>
