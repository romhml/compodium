<script setup lang="ts">
const rendererLoaded = ref(false)
</script>

<template>
  <div class="flex flex-col bg-(--ui-bg)">
    <iframe
      v-show="rendererLoaded"
      ref="renderer"
      class="grow w-full"
      src="/__compodium__/renderer"
      allowtransparency="true"
      @load="rendererLoaded = true"
    />
  </div>
</template>
