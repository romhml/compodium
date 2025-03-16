<script setup lang="ts">
import USwitch from '@nuxt/ui/runtime/components/Switch.vue'

extendCompodiumMeta({
  defaultProps: {
    label: 'Switch me!'
  }
})
</script>

<template>
  <USwitch />
</template>
