<script setup lang="ts">
import UButton from '@nuxt/ui/runtime/components/Button.vue'

extendCompodiumMeta({
  defaultProps: {
    label: 'Click me!'
  }
})
</script>

<template>
  <UButton />
</template>
