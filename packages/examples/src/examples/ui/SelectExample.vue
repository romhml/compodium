<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    defaultValue: 'Option 1',
    items: ['Option 1', 'Option 2', 'Option 3']
  }
})
</script>

<template>
  <USelect />
</template>
