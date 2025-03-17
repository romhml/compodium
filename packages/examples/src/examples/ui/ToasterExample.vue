<script setup lang="ts">
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
