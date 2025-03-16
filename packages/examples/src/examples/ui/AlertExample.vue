<script setup lang="ts">
import UAlert from '@nuxt/ui/runtime/components/Alert.vue'

extendCompodiumMeta({
  defaultProps: {
    title: 'Heads up!'
  }
})
</script>

<template>
  <UAlert />
</template>
