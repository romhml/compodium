<script setup lang="ts">
import UCheckbox from '@nuxt/ui/runtime/components/Checkbox.vue'

extendCompodiumMeta({
  defaultProps: {
    label: 'Check me!'
  }
})
</script>

<template>
  <UCheckbox />
</template>
