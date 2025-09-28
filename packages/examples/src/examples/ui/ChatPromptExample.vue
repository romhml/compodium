<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    modelValue: '',
    placeholder: 'Type your message...',
    size: 'md',
    icon: 'i-heroicons-paper-airplane'
  }
})
</script>

<template>
  <UChatPrompt class="w-full" />
</template>
