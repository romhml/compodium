<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    modelValue: 'light',
    options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' }
    ],
    size: 'md'
  }
})
</script>

<template>
  <UColorModeSelect class="w-32" />
</template>
