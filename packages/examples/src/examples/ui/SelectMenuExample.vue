<script setup lang="ts">
import USelectMenu from '@nuxt/ui/runtime/components/SelectMenu.vue'

extendCompodiumMeta({
  defaultProps: {
    items: ['Option 1', 'Option 2', 'Option 3']
  }
})
</script>

<template>
  <USelectMenu />
</template>
