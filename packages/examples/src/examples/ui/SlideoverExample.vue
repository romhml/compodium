<script setup lang="ts">
import USlideover from '@nuxt/ui/runtime/components/Slideover.vue'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
</script>

<template>
  <USlideover>
    <UButton
      color="neutral"
      variant="outline"
      label="Open Slideover"
    />
    <template #body>
      <div class="size-96" />
    </template>
  </USlideover>
</template>
