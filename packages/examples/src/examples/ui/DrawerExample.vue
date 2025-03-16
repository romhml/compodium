<script setup lang="ts">
import UDrawer from '@nuxt/ui/runtime/components/Drawer.vue'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
</script>

<template>
  <UDrawer>
    <UButton
      color="neutral"
      variant="outline"
      label="Open Drawer"
    />
    <template #body>
      <div class="size-96" />
    </template>
  </UDrawer>
</template>
