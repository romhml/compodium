<!-- src/runtime/root.vue -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import RendererComponent from './renderer.vue'
import { useAppConfig, useNuxtApp } from '#imports'

// @ts-expect-error virtual file
import { buildAssetsURL } from '#internal/nuxt/paths'

const appConfig = useAppConfig()
const options = appConfig.compodium as any

const nuxtApp = useNuxtApp()
const url = import.meta.server ? nuxtApp.ssrContext?.url : window.location.pathname

const NuxtRoot = defineAsyncComponent(() => import(/* @vite-ignore */ options.rootComponent).then(c => c.default))
const PreviewComponent = url?.startsWith('/__compodium__/renderer') && defineAsyncComponent(async () => {
  try {
    return await import(/* @vite-ignore */ buildAssetsURL(options.previewComponent)).then(c => c.default)
  } catch {
    return await import(/* @vite-ignore */ buildAssetsURL(options.defaultPreviewComponent)).then(c => c.default)
  }
})
</script>

<template>
  <Suspense>
    <template v-if="url?.startsWith('/__compodium__/renderer')">
      <PreviewComponent>
        <RendererComponent />
      </PreviewComponent>
    </template>
    <NuxtRoot v-else />
  </Suspense>
</template>
