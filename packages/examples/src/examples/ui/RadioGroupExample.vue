<script setup lang="ts">
import URadioGroup from '@nuxt/ui/runtime/components/RadioGroup.vue'

extendCompodiumMeta({
  defaultProps: {
    items: ['Option 1', 'Option 2', 'Option 3']
  }
})
</script>

<template>
  <URadioGroup />
</template>
