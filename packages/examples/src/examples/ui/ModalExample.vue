<script setup lang="ts">
import UModal from '@nuxt/ui/runtime/components/Modal.vue'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
</script>

<template>
  <UModal>
    <UButton
      label="Open Modal"
      color="neutral"
      variant="outline"
    />
    <template #content>
      <div class="h-72" />
    </template>
  </UModal>
</template>
