<script setup lang="ts">
import UButton from '@nuxt/ui/runtime/components/Button.vue'
import UButtonGroup from '@nuxt/ui/runtime/components/ButtonGroup.vue'
</script>

<template>
  <UButtonGroup>
    <UInput placeholder="Search..." />
    <UButton
      color="neutral"
      variant="outline"
    >
      Button
    </UButton>
  </UButtonGroup>
</template>
