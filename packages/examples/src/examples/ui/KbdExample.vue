<script setup lang="ts">
import UKbd from '@nuxt/ui/runtime/components/Kbd.vue'

extendCompodiumMeta({
  defaultProps: {
    value: 'K'
  }
})
</script>

<template>
  <UKbd />
</template>
