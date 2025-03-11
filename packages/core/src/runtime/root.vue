<script setup lang="ts">
import Renderer from './renderer.vue'

// TODO: Preview component
// const PreviewComponent = url?.startsWith('/__compodium__/renderer') && defineAsyncComponent(async () => {
//   // @ts-expect-error virtual file
//   return await import('#build/compodium/preview.mjs').then(c => c.default)
// })
</script>

<template>
  <Suspense>
    <div
      id="__compodium-root"
      :style="{ position: 'relative', width: 'fit-content', height: 'fit-content' }"
    >
      <!-- <PreviewComponent> -->
      <Renderer />
      <!-- </PreviewComponent> -->
    </div>
  </Suspense>
</template>
