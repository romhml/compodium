<script setup lang="ts">
import UFormField from '@nuxt/ui/runtime/components/FormField.vue'
import UInput from '@nuxt/ui/runtime/components/Input.vue'

extendCompodiumMeta({
  defaultProps: {
    label: 'Label'
  }
})
</script>

<template>
  <UFormField>
    <UInput />
  </UFormField>
</template>
