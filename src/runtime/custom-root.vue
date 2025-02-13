<!-- src/runtime/root.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CompodiumRenderer from './pages/CompodiumRenderer.vue'
import { useAppConfig, useNuxtApp } from '#imports'

// @ts-expect-error virtual file
import { buildAssetsURL } from '#internal/nuxt/paths'

const appConfig = useAppConfig()
const options = appConfig._compodium as any

const NuxtRoot = defineAsyncComponent(() => import(/* @vite-ignore */ options.appRootComponent).then(c => c.default))
const RootComponent = options.rootComponent && defineAsyncComponent(() => import(/* @vite-ignore */ buildAssetsURL(options.rootComponent)).then(c => c.default))

const nuxtApp = useNuxtApp()
const url = import.meta.server ? nuxtApp.ssrContext?.url : window.location.pathname
</script>

<template>
  <Suspense>
    <template v-if="url?.startsWith('/__compodium__/renderer')">
      <RootComponent v-if="RootComponent">
        <CompodiumRenderer />
      </RootComponent>
      <CompodiumRenderer v-else />
    </template>
    <NuxtRoot v-else />
  </Suspense>
</template>
