<script setup lang="ts">
import UInputMenu from '@nuxt/ui/runtime/components/InputMenu.vue'

extendCompodiumMeta({
  defaultProps: {
    items: ['Option 1', 'Option 2', 'Option 3']
  }
})
</script>

<template>
  <UInputMenu />
</template>
