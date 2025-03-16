<script setup lang="ts">
import UCollapsible from '@nuxt/ui/runtime/components/Collapsible.vue'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
</script>

<template>
  <UCollapsible class="w-48">
    <UButton
      color="neutral"
      variant="outline"
      label="Open Collapse"
      block
    />
    <template #content>
      <div class="placeholder h-60" />
    </template>
  </UCollapsible>
</template>
