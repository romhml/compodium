<script setup lang="ts">
const toast = useToast()
</script>

<template>
  <UToaster>
    <UButton
      label="Open toast"
      @click="toast.add({ title: 'Heads up!' })"
    />
  </UToaster>
</template>
