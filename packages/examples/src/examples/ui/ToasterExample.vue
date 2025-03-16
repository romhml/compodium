<script setup lang="ts">
import UToaster from '@nuxt/ui/runtime/components/Toaster.vue'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
import { useToast } from '@nuxt/ui/runtime/composables/useToast'

const toast = useToast()
</script>

<template>
  <UToaster>
    <UButton
      color="neutral"
      variant="outline"
      label="Open Toast"
      @click="toast.add({ title: 'Heads up!' })"
    />
  </UToaster>
</template>
